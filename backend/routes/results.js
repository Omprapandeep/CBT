const express = require('express');
const Attempt = require('../models/Attempt');
const Test = require('../models/Test');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/:attemptId', async (req, res) => {
  try {
    const attempt = await Attempt.findById(req.params.attemptId);
    if (!attempt) return res.status(404).json({ message: 'Attempt not found' });

    const test = await Test.findById(attempt.test);
    if (!test) return res.status(404).json({ message: 'Test not found' });

    const questionMap = new Map(test.questions.map(q => [String(q._id), q]));

    // Question-wise review with correct answer + explanation + images
    const review = attempt.answers.map(a => {
      const q = questionMap.get(String(a.questionId));
      return {
        questionId: a.questionId,
        subject: q.subject,
        questionText: q.questionText,
        options: q.options,
        correctOption: q.correctOption,
        explanation: q.explanation,
        selectedOption: a.selectedOption,
        status: a.status,
        isCorrect: a.selectedOption !== -1 && a.selectedOption === q.correctOption,
        isAttempted: a.selectedOption !== -1,
        // Image fields
        questionImageUrl: q.questionImageUrl || null,
        optionImageUrls: [
          q.option1ImageUrl || null,
          q.option2ImageUrl || null,
          q.option3ImageUrl || null,
          q.option4ImageUrl || null,
        ],
      };
    });

    // Subject-wise breakdown
    const subjectStats = {};
    review.forEach(r => {
      if (!subjectStats[r.subject]) {
        subjectStats[r.subject] = { total: 0, correct: 0, wrong: 0, unattempted: 0, score: 0 };
      }
      const s = subjectStats[r.subject];
      s.total++;
      if (!r.isAttempted) s.unattempted++;
      else if (r.isCorrect) { s.correct++; s.score += test.marksCorrect; }
      else { s.wrong++; s.score += test.marksWrong; }
    });

    // Rank & percentile among all attempts for this test
    const allAttempts = await Attempt.find({ test: test._id }).select('score').sort({ score: -1 });
    const totalCandidates = allAttempts.length;
    const rank = allAttempts.findIndex(a => String(a._id) === String(attempt._id)) + 1;
    const scoredBelow = allAttempts.filter(a => a.score < attempt.score).length;
    const percentile = totalCandidates > 1 ? ((scoredBelow / (totalCandidates - 1)) * 100).toFixed(2) : 100;

    const maxScore = test.questions.length * test.marksCorrect;

    res.json({
      attemptId: attempt._id,
      testTitle: test.title,
      examName: test.examName,
      userName: attempt.userName,
      score: attempt.score,
      maxScore,
      correctCount: attempt.correctCount,
      wrongCount: attempt.wrongCount,
      unattemptedCount: attempt.unattemptedCount,
      totalQuestions: test.questions.length,
      totalTimeTaken: attempt.totalTimeTaken,
      accuracy: attempt.correctCount + attempt.wrongCount > 0
        ? ((attempt.correctCount / (attempt.correctCount + attempt.wrongCount)) * 100).toFixed(2)
        : '0.00',
      rank,
      totalCandidates,
      percentile,
      subjectStats,
      review,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
