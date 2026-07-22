import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function AdminAttempts() {
  const { testId } = useParams();
  const [attempts, setAttempts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/admin/tests/${testId}/attempts`).then(res => setAttempts(res.data));
  }, [testId]);

  return (
    <div className="container">
      <h2>Leaderboard</h2>
      <table className="attempts">
        <thead>
          <tr><th>Rank</th><th>Name</th><th>Score</th><th>Correct</th><th>Wrong</th><th>Unattempted</th><th>Time Taken</th></tr>
        </thead>
        <tbody>
          {attempts.map((a, idx) => (
            <tr key={a._id}>
              <td>{idx + 1}</td>
              <td>{a.userName}</td>
              <td>{a.score}</td>
              <td>{a.correctCount}</td>
              <td>{a.wrongCount}</td>
              <td>{a.unattemptedCount}</td>
              <td>{Math.floor(a.totalTimeTaken / 60)}m {a.totalTimeTaken % 60}s</td>
            </tr>
          ))}
        </tbody>
      </table>
      {attempts.length === 0 && <p style={{ marginTop: 16 }}>No attempts yet.</p>}
      <button className="btn btn-secondary" style={{ marginTop: 20 }} onClick={() => navigate('/admin')}>
        Back to Dashboard
      </button>
    </div>
  );
}
