export default function QuestionPalette({ questions, answers, currentIndex, onJump, onSubmit }) {
  const counts = { 'not-visited': 0, 'not-answered': 0, 'answered': 0, 'marked': 0, 'answered-marked': 0 };
  questions.forEach(q => {
    const status = answers[q._id]?.status || 'not-visited';
    counts[status]++;
  });

  return (
    <div className="cbt-palette">
      <div className="legend">
        <div className="legend-item"><span className="legend-box box-not-visited">{counts['not-visited']}</span> Not Visited</div>
        <div className="legend-item"><span className="legend-box box-not-answered">{counts['not-answered']}</span> Not Answered</div>
        <div className="legend-item"><span className="legend-box box-answered">{counts['answered']}</span> Answered</div>
        <div className="legend-item"><span className="legend-box box-marked">{counts['marked']}</span> Marked for Review</div>
        <div className="legend-item" style={{ gridColumn: '1 / -1' }}>
          <span className="legend-box box-answered-marked">{counts['answered-marked']}</span> Answered &amp; Marked for Review (considered for evaluation)
        </div>
      </div>

      <div className="q-grid">
        {questions.map((q, idx) => {
          const status = answers[q._id]?.status || 'not-visited';
          const classes = ['q-num'];
          if (status !== 'not-visited') classes.push(status);
          if (idx === currentIndex) classes.push('current');
          return (
            <button key={q._id} className={classes.join(' ')} onClick={() => onJump(idx)}>
              {idx + 1}
            </button>
          );
        })}
      </div>

      <button className="btn btn-primary" style={{ width: '100%', marginTop: 20, padding: 12 }} onClick={onSubmit}>
        SUBMIT TEST
      </button>
    </div>
  );
}
