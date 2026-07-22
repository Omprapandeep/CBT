import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import QuestionImage from '../components/QuestionImage';
import { useAuth } from '../context/AuthContext';
import Timer from '../components/Timer';
import ConfirmModal from '../components/ConfirmModal';

const STATUS_CLASSES = {
  'not-visited': 'qp-nv',
  'not-answered': 'qp-na',
  'answered': 'qp-ans',
  'marked': 'qp-mrk',
  'answered-marked': 'qp-amrk',
};

export default function TestPage() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // ── ALL Hooks declared together at the top (Rules of Hooks) ──
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const storageKey = `neet-cbt-${testId}-${user?.id}`;
  const questionEnterTime = useRef(Date.now());
  const totalStartTime = useRef(Date.now());
  const questionScrollRef = useRef(null);

  // ── 1. Load test ──
  useEffect(() => {
    api.get(`/tests/${testId}/start`).then(({ data }) => {
      setTest(data);
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setAnswers(parsed.answers || {});
        setSecondsLeft(parsed.secondsLeft ?? data.durationMinutes * 60);
        setCurrentIndex(parsed.currentIndex || 0);
      } else {
        const initial = {};
        data.questions.forEach(q => {
          initial[q._id] = { selectedOption: -1, status: 'not-visited', timeSpent: 0 };
        });
        if (data.questions[0]) {
          initial[data.questions[0]._id].status = 'not-answered';
        }
        setAnswers(initial);
        setSecondsLeft(data.durationMinutes * 60);
      }
    }).catch(err => {
      console.error('[Test Load Error]', err);
    });
  }, [testId, storageKey]);

  // ── 2. Persist locally ──
  useEffect(() => {
    if (!test || secondsLeft === null) return;
    localStorage.setItem(storageKey, JSON.stringify({ answers, secondsLeft, currentIndex }));
  }, [answers, secondsLeft, currentIndex, test, storageKey]);

  // ── 3. Prevent accidental tab close / page refresh during exam ──
  useEffect(() => {
    if (!test || submitting) return;
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'Your exam timer is running. Are you sure you want to leave?';
      return e.returnValue;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [test, submitting]);

  // ── 4. Lock browser back/forward buttons during exam ──
  useEffect(() => {
    if (!test || submitting) return;
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
      setShowSubmitModal(true);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [test, submitting]);

  // ── 3. Time tracking helper ──
  const recordTimeOnCurrent = useCallback((qId) => {
    if (!qId) return;
    const elapsed = Math.round((Date.now() - questionEnterTime.current) / 1000);
    setAnswers(prev => ({
      ...prev,
      [qId]: { ...prev[qId], timeSpent: (prev[qId]?.timeSpent || 0) + elapsed },
    }));
    questionEnterTime.current = Date.now();
  }, []);

  // ── 4. Early return if loading (NO HOOKS BELOW THIS LINE) ──
  if (!test || secondsLeft === null) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: 18 }}>
        Loading test…
      </div>
    );
  }

  const questions = test.questions;
  const currentQ = questions[currentIndex];
  const currentAnswer = answers[currentQ._id] || { selectedOption: -1, status: 'not-visited' };

  const selectOption = (optionIdx) => {
    setAnswers(prev => ({
      ...prev,
      [currentQ._id]: { ...prev[currentQ._id], selectedOption: optionIdx },
    }));
  };

  const goTo = (idx) => {
    recordTimeOnCurrent(currentQ._id);
    setCurrentIndex(idx);
    setAnswers(prev => {
      const target = questions[idx];
      const existing = prev[target._id];
      if (existing && existing.status === 'not-visited') {
        return { ...prev, [target._id]: { ...existing, status: 'not-answered' } };
      }
      return prev;
    });
    if (questionScrollRef.current) questionScrollRef.current.scrollTop = 0;
  };

  const saveAndNext = () => {
    setAnswers(prev => {
      const a = prev[currentQ._id];
      const status = a.selectedOption === -1 ? 'not-answered' : 'answered';
      return { ...prev, [currentQ._id]: { ...a, status } };
    });
    if (currentIndex < questions.length - 1) goTo(currentIndex + 1);
    else recordTimeOnCurrent(currentQ._id);
  };

  const clearResponse = () => {
    setAnswers(prev => ({
      ...prev,
      [currentQ._id]: { ...prev[currentQ._id], selectedOption: -1, status: 'not-answered' },
    }));
  };

  const saveAndMarkForReview = () => {
    setAnswers(prev => {
      const a = prev[currentQ._id];
      const status = a.selectedOption === -1 ? 'marked' : 'answered-marked';
      return { ...prev, [currentQ._id]: { ...a, status } };
    });
    if (currentIndex < questions.length - 1) goTo(currentIndex + 1);
    else recordTimeOnCurrent(currentQ._id);
  };

  const markForReviewAndNext = () => {
    setAnswers(prev => {
      const a = prev[currentQ._id];
      return { ...prev, [currentQ._id]: { ...a, status: 'marked' } };
    });
    if (currentIndex < questions.length - 1) goTo(currentIndex + 1);
    else recordTimeOnCurrent(currentQ._id);
  };

  const executeSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    recordTimeOnCurrent(currentQ._id);
    const totalTimeTaken = Math.round((Date.now() - totalStartTime.current) / 1000);
    const payloadAnswers = Object.entries(answers).map(([questionId, a]) => ({
      questionId,
      selectedOption: a.selectedOption,
      status: a.status,
      timeSpent: a.timeSpent || 0,
    }));
    try {
      const { data } = await api.post(`/tests/${testId}/submit`, { answers: payloadAnswers, totalTimeTaken });
      localStorage.removeItem(storageKey);
      navigate(`/result/${data.attemptId}`);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Submission failed');
      setSubmitting(false);
    }
  };

  const handleSubmit = () => {
    if (submitting) return;
    setShowSubmitModal(true);
  };

  const autoSubmit = () => {
    if (submitting) return;
    setSubmitting(true);
    recordTimeOnCurrent(currentQ._id);
    const totalTimeTaken = Math.round((Date.now() - totalStartTime.current) / 1000);
    const payloadAnswers = Object.entries(answers).map(([questionId, a]) => ({
      questionId,
      selectedOption: a.selectedOption,
      status: a.status,
      timeSpent: a.timeSpent || 0,
    }));
    api.post(`/tests/${testId}/submit`, { answers: payloadAnswers, totalTimeTaken }).then(({ data }) => {
      localStorage.removeItem(storageKey);
      navigate(`/result/${data.attemptId}`);
    }).catch(() => { setSubmitting(false); });
  };

  const counts = { 'not-visited': 0, 'not-answered': 0, 'answered': 0, 'marked': 0, 'answered-marked': 0 };
  Object.values(answers).forEach(a => {
    if (counts[a.status] !== undefined) counts[a.status]++;
  });

  const scrollDown = () => {
    if (questionScrollRef.current) {
      questionScrollRef.current.scrollBy({ top: 180, behavior: 'smooth' });
    }
  };
  const scrollUp = () => {
    if (questionScrollRef.current) {
      questionScrollRef.current.scrollBy({ top: -180, behavior: 'smooth' });
    }
  };

  const allSubjects = test?.subjects?.length
    ? test.subjects
    : [...new Set(questions.map(q => q.subject))];

  return (
    <div className="cbt-shell">

      {/* ═══════════════════════ STICKY HEADER ═══════════════════════ */}
      <div className="cbt-sticky-header">
        <div className="cbt-hdr-left">
          <span className="cbt-hdr-title">{test.title}</span>
          <div className="cbt-hdr-info">
            <div>
              <span className="cbt-hdr-label">Candidate Name</span>
              <span className="cbt-hdr-sep">:</span>
              <span className="cbt-hdr-val cbt-hdr-orange">{user?.name || 'Candidate'}</span>
            </div>
            <div>
              <span className="cbt-hdr-label">Subject Name</span>
              <span className="cbt-hdr-sep">:</span>
              <span className="cbt-hdr-val cbt-hdr-orange">{currentQ.subject?.toUpperCase()}</span>
            </div>
            <div>
              <span className="cbt-hdr-label">Remaining Time</span>
              <span className="cbt-hdr-sep">:</span>
              <Timer secondsLeft={secondsLeft} setSecondsLeft={setSecondsLeft} onExpire={autoSubmit} />
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════ SUBJECT SECTION TABS BAR ═══════════════════════ */}
      <div className="cbt-section-bar">
        <span className="cbt-sec-label">SECTIONS:</span>
        <div className="cbt-sec-tabs">
          {allSubjects.map(sub => {
            const subCount = questions.filter(q => q.subject.toLowerCase() === sub.toLowerCase()).length;
            const isActive = currentQ.subject?.toLowerCase() === sub.toLowerCase();
            return (
              <button
                key={sub}
                className={`cbt-sec-tab ${isActive ? 'active' : ''}`}
                onClick={() => {
                  const firstIdx = questions.findIndex(q => q.subject.toLowerCase() === sub.toLowerCase());
                  if (firstIdx !== -1) goTo(firstIdx);
                }}
              >
                {sub} <span className="cbt-sec-count">({subCount})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════ TWO-PANEL BODY ═══════════════════════ */}
      <div className="cbt-panels">

        {/* ─────────── LEFT: Question Panel ─────────── */}
        <div className={`cbt-left${paletteOpen ? '' : ' cbt-left-full'}`}>
          {/* Scrollable inner */}
          <div className="cbt-q-scroll" ref={questionScrollRef}>

            {/* Question heading row */}
            <div className="cbt-q-heading-row">
              <h3 className="cbt-q-title">Question {currentIndex + 1}:</h3>
              <button className="cbt-scroll-btn" onClick={scrollDown} title="Scroll down">
                <svg viewBox="0 0 20 20" width="16" height="16" fill="white">
                  <path d="M10 14L3 7h14z" />
                </svg>
              </button>
            </div>
            <div className="cbt-q-divider" />

            {/* Question body — options A/B/C/D shown as part of content */}
            <div className="cbt-q-body">
              <div className="cbt-q-text">{currentQ.questionText}</div>
              {currentQ.questionImageUrl && (
                <QuestionImage
                  src={currentQ.questionImageUrl}
                  alt={`Question ${currentIndex + 1} diagram`}
                  maxHeight="300px"
                  className="cbt-q-image-wrap"
                />
              )}
              <div className="cbt-q-opts-grid">
                {currentQ.options.map((opt, idx) => (
                  <div key={idx} className="cbt-q-opt-item">
                    <span className="cbt-q-opt-label">({String.fromCharCode(65 + idx)})</span>
                    <div className="cbt-q-opt-content">
                      {currentQ.optionImageUrls?.[idx] && (
                        <QuestionImage
                          src={currentQ.optionImageUrls[idx]}
                          alt={`Option ${String.fromCharCode(65 + idx)}`}
                          maxHeight="150px"
                          className="cbt-opt-image"
                        />
                      )}
                      {opt && <span className="cbt-q-opt-text">{opt}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Radio row — 1) 2) 3) 4) */}
            <div className="cbt-radio-row">
              {currentQ.options.map((_, idx) => (
                <label key={idx} className="cbt-radio-label">
                  <input
                    type="radio"
                    name={`q-${currentQ._id}`}
                    checked={currentAnswer.selectedOption === idx}
                    onChange={() => selectOption(idx)}
                  />
                  <span className="cbt-radio-num">{idx + 1} )</span>
                </label>
              ))}
            </div>

            <div className="cbt-q-divider" />

            {/* Up scroll button row */}
            <div className="cbt-scroll-up-row">
              <button className="cbt-scroll-btn cbt-scroll-btn-up" onClick={scrollUp} title="Scroll up">
                <svg viewBox="0 0 20 20" width="16" height="16" fill="white">
                  <path d="M10 6l7 7H3z" />
                </svg>
              </button>
            </div>

          </div>{/* end cbt-q-scroll */}

          {/* ── Action buttons (outside scroll, always visible) ── */}
          <div className="cbt-actions-wrap">
            <div className="cbt-actions-row1">
              <button className="cbt-btn cbt-btn-green" onClick={saveAndNext}>SAVE &amp; NEXT</button>
              <button className="cbt-btn cbt-btn-white" onClick={clearResponse}>CLEAR</button>
              <button className="cbt-btn cbt-btn-orange" onClick={saveAndMarkForReview}>SAVE &amp; MARK FOR REVIEW</button>
              <button className="cbt-btn cbt-btn-blue" onClick={markForReviewAndNext}>MARK FOR REVIEW &amp; NEXT</button>
            </div>
            <div className="cbt-actions-row2">
              <div className="cbt-nav-btns">
                <button
                  className="cbt-btn cbt-btn-nav"
                  disabled={currentIndex === 0}
                  onClick={() => goTo(currentIndex - 1)}
                >&lt;&lt; BACK</button>
                <button
                  className="cbt-btn cbt-btn-nav"
                  disabled={currentIndex === questions.length - 1}
                  onClick={() => goTo(currentIndex + 1)}
                >NEXT &gt;&gt;</button>
              </div>
              <button
                className="cbt-btn cbt-btn-submit"
                onClick={handleSubmit}
                disabled={submitting}
              >{submitting ? 'Submitting…' : 'SUBMIT'}</button>
            </div>
          </div>
        </div>{/* end cbt-left */}

        {/* ─────────── COLLAPSE TOGGLE ─────────── */}
        <button
          className={`cbt-collapse-toggle${paletteOpen ? '' : ' collapsed'}`}
          onClick={() => setPaletteOpen(o => !o)}
          title={paletteOpen ? 'Collapse palette' : 'Expand palette'}
        >
          {paletteOpen ? '>' : '<'}
        </button>

        {/* ─────────── RIGHT: Question Palette ─────────── */}
        <div className={`cbt-right${paletteOpen ? '' : ' cbt-right-hidden'}`}>

          {/* Legend — sticky within right panel */}
          <div className="cbt-legend-box">
            <div className="cbt-legend-grid">
              {/* Row 1 */}
              <div className="cbt-legend-item">
                <span className="cbt-qicon qp-nv">{counts['not-visited']}</span>
                <span className="cbt-legend-text">Not Visited</span>
              </div>
              <div className="cbt-legend-item">
                <span className="cbt-qicon qp-na">{counts['not-answered']}</span>
                <span className="cbt-legend-text">Not Answered</span>
              </div>

              {/* Row 2 */}
              <div className="cbt-legend-item">
                <span className="cbt-qicon qp-ans">{counts['answered']}</span>
                <span className="cbt-legend-text">Answered</span>
              </div>
              <div className="cbt-legend-item">
                <span className="cbt-qicon qp-mrk">{counts['marked']}</span>
                <span className="cbt-legend-text">Marked for Review</span>
              </div>

              {/* Row 3 (wide) */}
              <div className="cbt-legend-item cbt-legend-wide">
                <span className="cbt-qicon qp-amrk">
                  {counts['answered-marked']}
                  <span className="amrk-badge">✓</span>
                </span>
                <span className="cbt-legend-text">
                  Answered &amp; Marked for Review<br />
                  <em>(will be considered for evaluation)</em>
                </span>
              </div>
            </div>
          </div>



          {/* Question grid title */}
          <div className="cbt-grid-header">
            Choose a Question
          </div>

          {/* Palette number grid */}
          <div className="cbt-palette-grid-wrap">
            <div className="cbt-palette-grid">
              {questions.map((q, idx) => {
                const a = answers[q._id] || { status: 'not-visited' };
                const isCurrent = idx === currentIndex;
                const statusCls = STATUS_CLASSES[a.status] || 'qp-nv';
                const isAnsMarked = a.status === 'answered-marked';

                return (
                  <button
                    key={q._id}
                    className={`cbt-pnum ${statusCls}${isCurrent ? ' cbt-pnum-cur' : ''}`}
                    onClick={() => goTo(idx)}
                    title={`Question ${idx + 1} (${q.subject})`}
                  >
                    {idx + 1}
                    {isAnsMarked && <span className="amrk-badge">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

        </div>{/* end cbt-right */}

      </div>{/* end cbt-panels */}

      {/* ── Submission Confirm Modal ── */}
      <ConfirmModal
        isOpen={showSubmitModal}
        title="Submit Examination?"
        message="Are you sure you want to submit your exam? Once submitted, you cannot change your answers."
        confirmText="Yes, Submit Test"
        cancelText="Cancel"
        type="warning"
        onConfirm={executeSubmit}
        onClose={() => setShowSubmitModal(false)}
      />

      {/* ── Error Notification Modal ── */}
      <ConfirmModal
        isOpen={!!errorMessage}
        title="Submission Error"
        message={errorMessage}
        confirmText="OK"
        cancelText=""
        type="danger"
        onConfirm={() => setErrorMessage('')}
        onClose={() => setErrorMessage('')}
      />

    </div>
  );
}
