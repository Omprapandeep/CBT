const express = require('express');
const Test = require('../models/Test');
const Attempt = require('../models/Attempt');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// List published tests available to students
router.get('/', async (req, res) => {
  const tests = await Test.find({ isPublished: true }).sort({ createdAt: -1 });
  res.json(
    tests.map(t => ({
      _id: t._id,
      title: t.title,
      examName: t.examName,
      subjects: t.subjects,
      durationMinutes: t.durationMinutes,
      questionCount: t.questions.length,
      marksCorrect: t.marksCorrect,
      marksWrong: t.marksWrong,
    }))
  );
});

// Start a test - questions WITHOUT correct answers / explanations
router.get('/:id/start', async (req, res) => {
  const test = await Test.findById(req.params.id);
  if (!test || !test.isPublished) return res.status(404).json({ message: 'Test not found' });

  res.json({
    _id: test._id,
    title: test.title,
    examName: test.examName,
    subjects: test.subjects,
    durationMinutes: test.durationMinutes,
    marksCorrect: test.marksCorrect,
    marksWrong: test.marksWrong,
    questions: test.questions.map(q => ({
      _id: q._id,
      subject: q.subject,
      questionText: q.questionText,
      options: q.options,
      // Image fields
      questionImageUrl: q.questionImageUrl || null,
      optionImageUrls: [
        q.option1ImageUrl || null,
        q.option2ImageUrl || null,
        q.option3ImageUrl || null,
        q.option4ImageUrl || null,
      ],
    })),
  });
});

// Submit answers, compute score, save attempt
router.post('/:id/submit', async (req, res) => {
  try {
    const { answers, totalTimeTaken } = req.body; // answers: [{questionId, selectedOption, status, timeSpent}]
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ message: 'Test not found' });

    const answerMap = new Map((answers || []).map(a => [String(a.questionId), a]));

    let score = 0, correctCount = 0, wrongCount = 0, unattemptedCount = 0;
    const finalAnswers = test.questions.map(q => {
      const a = answerMap.get(String(q._id));
      const selectedOption = a && a.selectedOption !== undefined ? a.selectedOption : -1;
      const status = a?.status || 'not-visited';

      if (selectedOption === -1) {
        unattemptedCount++;
      } else if (selectedOption === q.correctOption) {
        correctCount++;
        score += test.marksCorrect;
      } else {
        wrongCount++;
        score += test.marksWrong;
      }

      return {
        questionId: q._id,
        selectedOption,
        status,
        timeSpent: a?.timeSpent || 0,
      };
    });

    const attempt = await Attempt.create({
      test: test._id,
      user: req.user.id,
      userName: req.user.name,
      answers: finalAnswers,
      score,
      correctCount,
      wrongCount,
      unattemptedCount,
      totalTimeTaken: totalTimeTaken || 0,
    });

    res.status(201).json({ attemptId: attempt._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// A student's own attempt history
router.get('/my/attempts', async (req, res) => {
  const attempts = await Attempt.find({ user: req.user.id }).populate('test', 'title examName').sort({ submittedAt: -1 });
  res.json(attempts);
});

module.exports = router;
