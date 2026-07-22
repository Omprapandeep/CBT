const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const XLSX = require('xlsx');

/**
 * Expected columns (case-insensitive, flexible naming):
 * Subject, Question, Option1, Option2, Option3, Option4, CorrectOption (1-4), Explanation
 *
 * Optional image columns (all nullable — backward compatible):
 * QuestionImageURL, Option1ImageURL, Option2ImageURL, Option3ImageURL, Option4ImageURL
 *
 * JSON files should be an array of objects with the same keys.
 */
function normalizeRow(row) {
  // Helper: find a value by trying multiple key name variants (case-insensitive, trim)
  const get = (...keys) => {
    for (const k of keys) {
      const found = Object.keys(row).find(
        rk => rk.trim().toLowerCase() === k.toLowerCase()
      );
      if (found && row[found] !== undefined && String(row[found]).trim() !== '') {
        return String(row[found]).trim();
      }
    }
    return undefined;
  };

  const subject      = get('subject');
  const questionText = get('question', 'questiontext', 'question text');
  const option1      = get('option1', 'optiona', 'option 1', 'opt1');
  const option2      = get('option2', 'optionb', 'option 2', 'opt2');
  const option3      = get('option3', 'optionc', 'option 3', 'opt3');
  const option4      = get('option4', 'optiond', 'option 4', 'opt4');
  const correctRaw   = get('correctoption', 'correct option', 'correct answer', 'correct', 'answer', 'key');
  const explanation  = get('explanation', 'solution', 'hint') || '';

  // ── Optional image URL columns ──
  const questionImageUrl = get('questionimageurl', 'question image url', 'questionimage', 'question_image_url', 'question image') || null;
  const option1ImageUrl  = get('option1imageurl', 'option1 image url', 'option 1 image url', 'opt1imageurl', 'option1_image_url', 'option1image') || null;
  const option2ImageUrl  = get('option2imageurl', 'option2 image url', 'option 2 image url', 'opt2imageurl', 'option2_image_url', 'option2image') || null;
  const option3ImageUrl  = get('option3imageurl', 'option3 image url', 'option 3 image url', 'opt3imageurl', 'option3_image_url', 'option3image') || null;
  const option4ImageUrl  = get('option4imageurl', 'option4 image url', 'option 4 image url', 'opt4imageurl', 'option4_image_url', 'option4image') || null;

  if (!subject || !questionText || !option1 || !option2 || !option3 || !option4 || correctRaw === undefined) {
    return null; // incomplete row — skip
  }

  // Parse correct option: support 1-4 (number) or A-D (letter)
  let correctOption = parseInt(correctRaw, 10);
  if (isNaN(correctOption)) {
    const letterMap = { A: 1, B: 2, C: 3, D: 4 };
    correctOption = letterMap[String(correctRaw).trim().toUpperCase()];
  }

  // Convert 1-indexed (1–4) to 0-indexed (0–3)
  correctOption = correctOption - 1;
  if (correctOption < 0 || correctOption > 3) return null;

  return {
    subject,
    questionText,
    options: [option1, option2, option3, option4],
    correctOption,
    explanation,
    questionImageUrl,
    option1ImageUrl,
    option2ImageUrl,
    option3ImageUrl,
    option4ImageUrl,
  };
}

function parseQuestionsFromFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  let rawRows = [];

  if (ext === '.json') {
    const content = fs.readFileSync(filePath, 'utf-8');
    rawRows = JSON.parse(content);
    if (!Array.isArray(rawRows)) {
      throw new Error('JSON file must contain an array of question objects');
    }
  } else if (ext === '.csv') {
    const content = fs.readFileSync(filePath, 'utf-8');
    rawRows = parse(content, {
      columns: true,           // first row is headers
      skip_empty_lines: true,
      trim: true,
      bom: true,               // handle BOM (from Excel-saved CSVs)
      relax_quotes: true,      // be lenient with quoting inside values
      relax_column_count: true // don't crash on extra/missing columns
    });
  } else if (ext === '.xlsx' || ext === '.xls') {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
  } else {
    throw new Error('Unsupported file type. Use .csv, .xlsx, .xls, or .json');
  }

  const questions = [];
  const skipped   = [];

  rawRows.forEach((row, idx) => {
    const q = normalizeRow(row);
    if (q) {
      questions.push(q);
    } else {
      skipped.push(idx + 2);
    }
  });

  if (questions.length === 0) {
    throw new Error(
      'No valid questions found in file.\n' +
      'Required columns: Subject, Question, Option1, Option2, Option3, Option4, CorrectOption (1–4), Explanation\n' +
      'Optional columns: QuestionImageURL, Option1ImageURL, Option2ImageURL, Option3ImageURL, Option4ImageURL\n' +
      'Skipped rows: ' + (skipped.length ? skipped.join(', ') : 'none')
    );
  }

  return { questions, skippedRows: skipped };
}

module.exports = { parseQuestionsFromFile };
