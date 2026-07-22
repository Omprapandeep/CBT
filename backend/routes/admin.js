const express = require('express');
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const Test = require('../models/Test');
const Attempt = require('../models/Attempt');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { bulkUpload, imageUpload } = require('../middleware/upload');
const { parseQuestionsFromFile } = require('../utils/parseQuestions');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');

const router = express.Router();
router.use(requireAuth, requireAdmin);

function isUrl(str) {
  return /^https?:\/\//i.test(str);
}

function safeUnlink(filePath) {
  try { if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (_) {}
}

function safeRmdir(dirPath) {
  try { if (dirPath && fs.existsSync(dirPath)) fs.rmSync(dirPath, { recursive: true, force: true }); } catch (_) {}
}

// ═══════════════════════════════════════════════════════════════════════
// POST /api/admin/upload-image
// ═══════════════════════════════════════════════════════════════════════
router.post('/upload-image', imageUpload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image file provided' });

    const folder = req.body.folder || 'neet-app/questions';
    const url = await uploadToCloudinary(req.file.path, folder);
    safeUnlink(req.file.path);

    res.json({ url });
  } catch (err) {
    if (req.file) safeUnlink(req.file.path);
    console.error('[Upload Image Error]', err);
    res.status(500).json({ message: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════
// POST /api/admin/tests/upload
// Bulk-create a test. Accepts 'file' (CSV/XLSX/JSON) and optional
// 'images' (ZIP of image files referenced by filename in image columns).
// ═══════════════════════════════════════════════════════════════════════
router.post('/tests/upload',
  bulkUpload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'images', maxCount: 1 },
  ]),
  async (req, res) => {
    let tempDir = null;
    const questionFile = req.files?.file?.[0];
    const zipFile = req.files?.images?.[0];

    try {
      const { title, examName, durationMinutes, marksCorrect, marksWrong } = req.body;
      if (!questionFile) return res.status(400).json({ message: 'Question file is required' });
      if (!title || !durationMinutes) {
        safeUnlink(questionFile?.path);
        safeUnlink(zipFile?.path);
        return res.status(400).json({ message: 'title and durationMinutes are required' });
      }

      // ── Parse questions from the data file ──
      const { questions, skippedRows } = parseQuestionsFromFile(questionFile.path);
      safeUnlink(questionFile.path);

      // ── Handle ZIP images if provided ──
      const imageWarnings = [];
      let imagesUploaded = 0;

      if (zipFile) {
        // Extract ZIP to a temp directory
        tempDir = path.join(path.dirname(zipFile.path), `zip-${Date.now()}`);
        const zip = new AdmZip(zipFile.path);
        zip.extractAllTo(tempDir, true);
        safeUnlink(zipFile.path);

        // Build a map of filename → absolute path (case-sensitive) from the ZIP
        const fileMap = new Map();
        function scanDir(dir) {
          for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            if (entry.isDirectory()) {
              scanDir(path.join(dir, entry.name));
            } else {
              fileMap.set(entry.name, path.join(dir, entry.name));
            }
          }
        }
        scanDir(tempDir);

        const folder = `neet-app/questions`;
        const imageFields = [
          'questionImageUrl',
          'option1ImageUrl', 'option2ImageUrl', 'option3ImageUrl', 'option4ImageUrl',
        ];

        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          for (const field of imageFields) {
            const val = q[field];
            if (!val) continue;
            if (isUrl(val)) continue; // already a full URL — leave as-is

            const filePath = fileMap.get(val);
            if (!filePath) {
              imageWarnings.push(`Row ${i + 2}: image '${val}' referenced in ${field} but not found in ZIP`);
              q[field] = null;
              continue;
            }

            try {
              const url = await uploadToCloudinary(filePath, folder);
              q[field] = url;
              imagesUploaded++;
            } catch (uploadErr) {
              imageWarnings.push(`Row ${i + 2}: failed to upload '${val}' — ${uploadErr.message}`);
              q[field] = null;
            }
          }
        }
      }

      if (tempDir) safeRmdir(tempDir);

      const subjects = [...new Set(questions.map(q => q.subject))];

      const test = await Test.create({
        title,
        examName: examName || 'NEET',
        subjects,
        durationMinutes: Number(durationMinutes),
        marksCorrect: marksCorrect !== undefined ? Number(marksCorrect) : 4,
        marksWrong: marksWrong !== undefined ? Number(marksWrong) : -1,
        questions,
      });

      res.status(201).json({
        test,
        importedCount: questions.length,
        skippedRows,
        imagesUploaded,
        imageWarnings,
      });
    } catch (err) {
      safeUnlink(questionFile?.path);
      safeUnlink(zipFile?.path);
      if (tempDir) safeRmdir(tempDir);
      console.error('[Upload Error]', err);
      const status = err.name === 'ValidationError' || err.message?.includes('No valid questions') ? 400 : 500;
      res.status(status).json({ message: err.message });
    }
  }
);

// ═══════════════════════════════════════════════════════════════════════
// PUT /api/admin/tests/:testId/questions/:questionId
// Update question & delete replaced/removed images from Cloudinary
// ═══════════════════════════════════════════════════════════════════════
router.put('/tests/:testId/questions/:questionId', async (req, res) => {
  try {
    const test = await Test.findById(req.params.testId);
    if (!test) return res.status(404).json({ message: 'Test not found' });

    const question = test.questions.id(req.params.questionId);
    if (!question) return res.status(404).json({ message: 'Question not found' });

    const imageFields = [
      'questionImageUrl', 'option1ImageUrl', 'option2ImageUrl', 'option3ImageUrl', 'option4ImageUrl'
    ];

    // Delete replaced or removed images from Cloudinary
    for (const field of imageFields) {
      if (req.body[field] !== undefined) {
        const oldUrl = question[field];
        const newUrl = req.body[field];
        if (oldUrl && oldUrl !== newUrl) {
          // Fire and forget image cleanup
          deleteFromCloudinary(oldUrl).catch(() => {});
        }
      }
    }

    const allowed = [
      'subject', 'questionText', 'options', 'correctOption', 'explanation',
      ...imageFields
    ];

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        question[key] = req.body[key];
      }
    }

    await test.save();
    res.json({ question });
  } catch (err) {
    console.error('[Edit Question Error]', err);
    res.status(500).json({ message: err.message });
  }
});

// List all tests with attempt counts
router.get('/tests', async (req, res) => {
  const tests = await Test.find().sort({ createdAt: -1 });
  const withCounts = await Promise.all(
    tests.map(async (t) => {
      const attemptCount = await Attempt.countDocuments({ test: t._id });
      return {
        _id: t._id,
        title: t.title,
        examName: t.examName,
        subjects: t.subjects,
        durationMinutes: t.durationMinutes,
        questionCount: t.questions.length,
        isPublished: t.isPublished,
        attemptCount,
        createdAt: t.createdAt,
      };
    })
  );
  res.json(withCounts);
});

// Get one test in full
router.get('/tests/:id', async (req, res) => {
  const test = await Test.findById(req.params.id);
  if (!test) return res.status(404).json({ message: 'Test not found' });
  res.json(test);
});

// Toggle publish status
router.patch('/tests/:id/publish', async (req, res) => {
  const test = await Test.findById(req.params.id);
  if (!test) return res.status(404).json({ message: 'Test not found' });
  test.isPublished = !test.isPublished;
  await test.save();
  res.json({ isPublished: test.isPublished });
});

// ═══════════════════════════════════════════════════════════════════════
// DELETE /api/admin/tests/:id
// Delete test document, attempts, AND all Cloudinary images in test
// ═══════════════════════════════════════════════════════════════════════
router.delete('/tests/:id', async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ message: 'Test not found' });

    // Collect all image URLs across all questions in the test
    const imageFields = [
      'questionImageUrl', 'option1ImageUrl', 'option2ImageUrl', 'option3ImageUrl', 'option4ImageUrl'
    ];
    const urlsToDelete = [];

    for (const q of test.questions) {
      for (const field of imageFields) {
        if (q[field]) urlsToDelete.push(q[field]);
      }
    }

    // Delete images from Cloudinary in parallel
    if (urlsToDelete.length > 0) {
      await Promise.allSettled(urlsToDelete.map(url => deleteFromCloudinary(url)));
    }

    // Delete test and attempts from DB
    await Test.findByIdAndDelete(req.params.id);
    await Attempt.deleteMany({ test: req.params.id });

    res.json({ message: 'Test and associated Cloudinary images deleted successfully', deletedImagesCount: urlsToDelete.length });
  } catch (err) {
    console.error('[Delete Test Error]', err);
    res.status(500).json({ message: err.message });
  }
});

// Leaderboard / all attempts for a test
router.get('/tests/:id/attempts', async (req, res) => {
  const attempts = await Attempt.find({ test: req.params.id }).sort({ score: -1 });
  res.json(attempts);
});

module.exports = router;
