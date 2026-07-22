const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure the uploads directory always exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

// ── Question data files (CSV/XLSX/JSON) ──
const questionFileFilter = (req, file, cb) => {
  const allowed = ['.csv', '.xlsx', '.xls', '.json'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error('Only .csv, .xlsx, .xls or .json files are allowed'));
};

const questionUpload = multer({ storage, fileFilter: questionFileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

// ── Image files (single image upload) ──
const imageFileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error('Only image files (jpg, png, gif, webp, svg) are allowed'));
};

const imageUpload = multer({ storage, fileFilter: imageFileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// ── Bulk upload: question file + optional images ZIP ──
const bulkFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (file.fieldname === 'file') {
    const allowed = ['.csv', '.xlsx', '.xls', '.json'];
    if (allowed.includes(ext)) return cb(null, true);
    return cb(new Error('Question file must be .csv, .xlsx, .xls or .json'));
  }
  if (file.fieldname === 'images') {
    if (ext === '.zip') return cb(null, true);
    return cb(new Error('Images file must be a .zip archive'));
  }
  cb(new Error('Unexpected field'));
};

const bulkUpload = multer({ storage, fileFilter: bulkFileFilter, limits: { fileSize: 50 * 1024 * 1024 } });

module.exports = { questionUpload, imageUpload, bulkUpload };
