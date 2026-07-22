import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import QuestionImage from '../components/QuestionImage';

export default function AdminEditTest() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [saving, setSaving] = useState({});      // { questionId: true } while saving
  const [uploading, setUploading] = useState({}); // { `${qid}-${field}`: true } while uploading
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get(`/admin/tests/${testId}`).then(({ data }) => setTest(data));
  }, [testId]);

  const [errorMessage, setErrorMessage] = useState('');

  // ── Upload a single image to Cloudinary, then save to the question ──
  const handleImageUpload = async (questionId, field, file) => {
    const key = `${questionId}-${field}`;
    setUploading(u => ({ ...u, [key]: true }));
    setErrorMessage('');
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('folder', `neet-app/questions/${testId}`);
      const { data } = await api.post('/admin/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      await api.put(`/admin/tests/${testId}/questions/${questionId}`, { [field]: data.url });

      setTest(prev => ({
        ...prev,
        questions: prev.questions.map(q =>
          q._id === questionId ? { ...q, [field]: data.url } : q
        ),
      }));
      setMessage(`Image updated successfully`);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setErrorMessage('Image upload failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(u => ({ ...u, [key]: false }));
    }
  };

  // ── Remove an image (set field to null) ──
  const handleRemoveImage = async (questionId, field) => {
    setSaving(s => ({ ...s, [questionId]: true }));
    setErrorMessage('');
    try {
      await api.put(`/admin/tests/${testId}/questions/${questionId}`, { [field]: null });
      setTest(prev => ({
        ...prev,
        questions: prev.questions.map(q =>
          q._id === questionId ? { ...q, [field]: null } : q
        ),
      }));
      setMessage(`Image removed`);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setErrorMessage('Failed to remove image: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(s => ({ ...s, [questionId]: false }));
    }
  };

  // ── Trigger file input for a specific field ──
  const triggerUpload = (questionId, field) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      if (e.target.files[0]) handleImageUpload(questionId, field, e.target.files[0]);
    };
    input.click();
  };

  if (!test) return <div className="container">Loading test...</div>;

  const optionFields = ['option1ImageUrl', 'option2ImageUrl', 'option3ImageUrl', 'option4ImageUrl'];

  return (
    <div className="container" style={{ maxWidth: 1100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2>{test.title} — Edit Questions</h2>
          <p style={{ color: '#666', fontSize: 13 }}>{test.questions.length} questions • {test.examName}</p>
        </div>
        <button className="btn btn-outline" onClick={() => navigate('/admin')}>← Back to Dashboard</button>
      </div>

      {message && (
        <div style={{ background: '#e6f6e8', border: '1px solid #a5d6a7', padding: '8px 14px', borderRadius: 6, marginBottom: 16, fontSize: 13, color: '#1a7a3c' }}>
          ✓ {message}
        </div>
      )}

      {errorMessage && (
        <div style={{ background: '#fbe6e6', border: '1px solid #f5c6cb', padding: '8px 14px', borderRadius: 6, marginBottom: 16, fontSize: 13, color: '#c0392b' }}>
          ⚠ {errorMessage}
        </div>
      )}

      {test.questions.map((q, idx) => (
        <div key={q._id} className="admin-q-card">
          <div className="admin-q-header">
            <strong>Q{idx + 1}.</strong>
            <span className="admin-q-subject">[{q.subject}]</span>
          </div>

          <p className="admin-q-text">{q.questionText}</p>

          {/* ── Question Image ── */}
          <div className="admin-img-section">
            <span className="admin-img-label">Question Image:</span>
            {q.questionImageUrl ? (
              <div className="admin-img-preview-row">
                <QuestionImage src={q.questionImageUrl} alt="Question image" maxHeight="180px" />
                <div className="admin-img-actions">
                  <button
                    className="admin-img-btn admin-img-btn-change"
                    onClick={() => triggerUpload(q._id, 'questionImageUrl')}
                    disabled={uploading[`${q._id}-questionImageUrl`]}
                  >
                    {uploading[`${q._id}-questionImageUrl`] ? '⏳' : '🔄'} Change
                  </button>
                  <button
                    className="admin-img-btn admin-img-btn-remove"
                    onClick={() => handleRemoveImage(q._id, 'questionImageUrl')}
                    disabled={saving[q._id]}
                  >
                    ✕ Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="admin-img-btn admin-img-btn-add"
                onClick={() => triggerUpload(q._id, 'questionImageUrl')}
                disabled={uploading[`${q._id}-questionImageUrl`]}
              >
                {uploading[`${q._id}-questionImageUrl`] ? '⏳ Uploading...' : '+ Add Question Image'}
              </button>
            )}
          </div>

          {/* ── Options with Images ── */}
          <div className="admin-opts-grid">
            {q.options.map((opt, oi) => {
              const field = optionFields[oi];
              const imgUrl = q[field];
              const uploadKey = `${q._id}-${field}`;
              return (
                <div key={oi} className="admin-opt-item">
                  <div className="admin-opt-label">
                    ({String.fromCharCode(65 + oi)}) {opt}
                  </div>
                  {imgUrl ? (
                    <div className="admin-img-preview-row admin-img-preview-small">
                      <QuestionImage src={imgUrl} alt={`Option ${String.fromCharCode(65 + oi)}`} maxHeight="100px" />
                      <div className="admin-img-actions">
                        <button
                          className="admin-img-btn admin-img-btn-change"
                          onClick={() => triggerUpload(q._id, field)}
                          disabled={uploading[uploadKey]}
                        >
                          {uploading[uploadKey] ? '⏳' : '🔄'}
                        </button>
                        <button
                          className="admin-img-btn admin-img-btn-remove"
                          onClick={() => handleRemoveImage(q._id, field)}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="admin-img-btn admin-img-btn-add admin-img-btn-small"
                      onClick={() => triggerUpload(q._id, field)}
                      disabled={uploading[uploadKey]}
                    >
                      {uploading[uploadKey] ? '⏳' : '🖼 Add image'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
