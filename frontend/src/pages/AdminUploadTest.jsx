import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function AdminUploadTest() {
  const [title, setTitle] = useState('');
  const [examName, setExamName] = useState('NEET');
  const [durationMinutes, setDurationMinutes] = useState(180);
  const [marksCorrect, setMarksCorrect] = useState(4);
  const [marksWrong, setMarksWrong] = useState(-1);
  const [file, setFile] = useState(null);
  const [imagesZip, setImagesZip] = useState(null);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setResult(null);
    if (!file) return setError('Please choose a question file (.csv, .xlsx or .json)');

    const formData = new FormData();
    formData.append('title', title);
    formData.append('examName', examName);
    formData.append('durationMinutes', durationMinutes);
    formData.append('marksCorrect', marksCorrect);
    formData.append('marksWrong', marksWrong);
    formData.append('file', file);
    if (imagesZip) {
      formData.append('images', imagesZip);
    }

    setLoading(true);
    try {
      const { data } = await api.post('/admin/tests/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h2>Upload New Test</h2>
      <p className="hint">
        <strong>Required columns:</strong> Subject, Question, Option1, Option2, Option3, Option4, CorrectOption (1-4 or A-D), Explanation
      </p>
      <p className="hint" style={{ marginTop: 4 }}>
        <strong>Optional image columns:</strong> QuestionImageURL, Option1ImageURL, Option2ImageURL, Option3ImageURL, Option4ImageURL
        — use full URLs (pre-hosted) or filenames that match files inside the optional ZIP below.
      </p>
      <p className="hint" style={{ marginTop: 4 }}>
        Supported formats: .csv, .xlsx, .json (array of objects with the same keys).
      </p>

      {error && <p className="error-text">{error}</p>}

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <label>Test Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} required />
        </div>
        <div className="form-row">
          <label>Exam Name</label>
          <input value={examName} onChange={e => setExamName(e.target.value)} />
        </div>
        <div className="form-row">
          <label>Duration (minutes)</label>
          <input type="number" value={durationMinutes} onChange={e => setDurationMinutes(e.target.value)} required />
        </div>
        <div className="form-row">
          <label>Marks for Correct Answer</label>
          <input type="number" value={marksCorrect} onChange={e => setMarksCorrect(e.target.value)} />
        </div>
        <div className="form-row">
          <label>Marks for Wrong Answer (negative marking)</label>
          <input type="number" value={marksWrong} onChange={e => setMarksWrong(e.target.value)} />
        </div>
        <div className="form-row">
          <label>Question File (CSV / Excel / JSON) <span style={{ color: '#c0392b' }}>*</span></label>
          <input type="file" accept=".csv,.xlsx,.xls,.json" onChange={e => setFile(e.target.files[0])} required />
        </div>
        <div className="form-row">
          <label>Question Images (optional ZIP)</label>
          <input type="file" accept=".zip" onChange={e => setImagesZip(e.target.files[0])} />
          <p className="hint">
            If your CSV references filenames (e.g. <code>q3_circuit.png</code>) in the image columns, upload a ZIP containing those files here.
            They'll be uploaded to Cloudinary automatically.
          </p>
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Uploading...' : 'Create Test'}
        </button>
      </form>

      {result && (
        <div style={{ marginTop: 20, background: '#eef7ee', padding: 14, borderRadius: 6 }}>
          <p><strong>{result.importedCount}</strong> questions imported successfully.</p>
          {result.imagesUploaded > 0 && (
            <p>📸 <strong>{result.imagesUploaded}</strong> images uploaded to Cloudinary.</p>
          )}
          {result.skippedRows?.length > 0 && (
            <p style={{ color: '#b8860b' }}>⚠ Skipped rows (incomplete data): {result.skippedRows.join(', ')}</p>
          )}
          {result.imageWarnings?.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <p style={{ color: '#c0392b', fontWeight: 600 }}>⚠ Image warnings:</p>
              <ul style={{ fontSize: 13, color: '#c0392b', paddingLeft: 20 }}>
                {result.imageWarnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}
          <button className="btn btn-secondary" style={{ marginTop: 10 }} onClick={() => navigate('/admin')}>
            Back to Dashboard
          </button>
        </div>
      )}
    </div>
  );
}
