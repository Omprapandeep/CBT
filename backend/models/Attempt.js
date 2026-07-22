const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
  selectedOption: { type: Number, default: -1 }, // -1 = not answered
  status: {
    type: String,
    enum: ['not-visited', 'not-answered', 'answered', 'marked', 'answered-marked'],
    default: 'not-visited',
  },
  timeSpent: { type: Number, default: 0 }, // seconds
}, { _id: false });

const attemptSchema = new mongoose.Schema({
  test: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  answers: { type: [answerSchema], default: [] },
  score: { type: Number, default: 0 },
  correctCount: { type: Number, default: 0 },
  wrongCount: { type: Number, default: 0 },
  unattemptedCount: { type: Number, default: 0 },
  totalTimeTaken: { type: Number, default: 0 }, // seconds
  submittedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Attempt', attemptSchema);
