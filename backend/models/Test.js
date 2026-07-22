const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  questionText: { type: String, required: true },
  options: { type: [String], validate: v => v.length === 4 },
  correctOption: { type: Number, required: true, min: 0, max: 3 }, // 0-indexed
  explanation: { type: String, default: '' },
  // Optional image URLs (Cloudinary-hosted)
  questionImageUrl: { type: String, default: null },
  option1ImageUrl: { type: String, default: null },
  option2ImageUrl: { type: String, default: null },
  option3ImageUrl: { type: String, default: null },
  option4ImageUrl: { type: String, default: null },
});

const testSchema = new mongoose.Schema({
  title: { type: String, required: true },
  examName: { type: String, default: 'NEET' },
  subjects: { type: [String], default: [] },
  durationMinutes: { type: Number, required: true },
  marksCorrect: { type: Number, default: 4 },
  marksWrong: { type: Number, default: -1 },
  questions: { type: [questionSchema], default: [] },
  isPublished: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Test', testSchema);
