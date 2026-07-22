import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/ConfirmModal';

export default function AdminDashboard() {
  const [tests, setTests] = useState([]);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const load = () => api.get('/admin/tests').then(res => setTests(res.data));

  useEffect(() => { load(); }, []);

  const togglePublish = async (id) => {
    await api.patch(`/admin/tests/${id}/publish`);
    load();
  };

  const [deleteId, setDeleteId] = useState(null);

  const confirmRemove = async () => {
    if (!deleteId) return;
    await api.delete(`/admin/tests/${deleteId}`);
    setDeleteId(null);
    load();
  };

  return (
    <div className="page">
      <div className="topbar">
        <h1>Admin Panel</h1>
        <div>
          <button onClick={() => { logout(); navigate('/login'); }}>Logout</button>
        </div>
      </div>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Tests</h2>
          <button className="btn btn-primary" onClick={() => navigate('/admin/upload')}>+ Upload New Test</button>
        </div>

        <table className="attempts" style={{ marginTop: 16 }}>
          <thead>
            <tr>
              <th>Title</th><th>Exam</th><th>Subjects</th><th>Questions</th><th>Duration</th>
              <th>Attempts</th><th>Published</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tests.map(t => (
              <tr key={t._id}>
                <td>{t.title}</td>
                <td>{t.examName}</td>
                <td>{t.subjects.join(', ')}</td>
                <td>{t.questionCount}</td>
                <td>{t.durationMinutes} min</td>
                <td>
                  <span style={{ cursor: 'pointer', color: '#1a3c8f', textDecoration: 'underline' }}
                    onClick={() => navigate(`/admin/test/${t._id}/attempts`)}>
                    {t.attemptCount}
                  </span>
                </td>
                <td>
                  <button className="btn btn-outline" onClick={() => togglePublish(t._id)}>
                    {t.isPublished ? 'Published' : 'Draft'}
                  </button>
                </td>
                <td>
                  <button className="btn btn-outline" style={{ marginRight: 6 }} onClick={() => navigate(`/admin/test/${t._id}/edit`)}>
                    Edit
                  </button>
                  <button className="btn" style={{ background: '#c0392b', color: '#fff' }} onClick={() => setDeleteId(t._id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {tests.length === 0 && <p style={{ marginTop: 16 }}>No tests uploaded yet.</p>}
      </div>

      <ConfirmModal
        isOpen={!!deleteId}
        title="Delete Test?"
        message="Are you sure you want to delete this test? This will permanently delete the test, all its questions, and all student attempts."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={confirmRemove}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}
