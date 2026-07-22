import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';

export default function TestInstructions() {
  const { testId } = useParams();
  const navigate   = useNavigate();
  const [agreed, setAgreed] = useState(false);
  const [test, setTest] = useState(null);

  useEffect(() => {
    api.get(`/tests/${testId}/start`)
      .then(({ data }) => setTest(data))
      .catch(() => {});
  }, [testId]);

  return (
    <div className="instr-page">

      {/* Header */}
      <div className="instr-header">
        <div className="instr-header-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="instr-logo">NTA</div>
            <div>
              <div className="instr-portal-name">{test?.title || 'NEET CBT Practice Portal'}</div>
              <div className="instr-portal-sub">{test?.examName || 'National Eligibility cum Entrance Test'}</div>
            </div>
          </div>
          <button className="btn btn-outline" style={{ borderColor: '#fff', color: '#fff', padding: '6px 14px' }} onClick={() => navigate('/dashboard')}>
            ← Back to Dashboard
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="instr-body">
        <h2 className="instr-main-title">Please read the instructions carefully</h2>

        {/* General Instructions */}
        <div className="instr-section-head">General Instructions:</div>
        <ol className="instr-ol">
          <li>Total duration of {test?.title || 'NEET Exam'} is {test?.durationMinutes || 180} min.</li>
          <li>
            The clock will be set at the server. The countdown timer in the top right corner of screen will
            display the remaining time available for you to complete the examination. When the timer reaches
            zero, the examination will end by itself. You will not be required to end or submit your examination.
          </li>
          <li>
            The Questions Palette displayed on the right side of screen will show the status of each question
            using one of the following symbols:
            {/* ─── Icon Legend ─── */}
            <ol className="instr-icon-list">
              <li>
                <span className="instr-icon instr-icon-nv"></span>
                You have not visited the question yet.
              </li>
              <li>
                <span className="instr-icon instr-icon-na">
                  <span className="instr-flag-na"></span>
                </span>
                You have not answered the question.
              </li>
              <li>
                <span className="instr-icon instr-icon-ans">
                  <span className="instr-flag-ans"></span>
                </span>
                You have answered the question.
              </li>
              <li>
                <span className="instr-icon instr-icon-mrk"></span>
                You have NOT answered the question, but have marked the question for review.
              </li>
              <li>
                <span className="instr-icon instr-icon-amrk">
                  <span className="instr-amrk-badge">✓</span>
                </span>
                The question(s) &ldquo;Answered and Marked for Review&rdquo; will be considered for evaluation.
              </li>
            </ol>
          </li>
          <li>
            You can click on the &ldquo;&gt;&rdquo; arrow which appears to the left of question palette to collapse the
            question palette thereby maximizing the question window. To view the question palette again, you
            can click on &ldquo;&lt;&rdquo; which appears on the right side of question window.
          </li>
          <li>
            You can click on any diagram or option image to expand it in full resolution.
          </li>
          <li>
            You can click on&nbsp;
            <span className="instr-nav-icon instr-nav-down">↓</span>
            &nbsp;to navigate to the bottom and&nbsp;
            <span className="instr-nav-icon instr-nav-up">↑</span>
            &nbsp;to navigate to top of the question area, without scrolling.
          </li>
        </ol>

        {/* Navigating */}
        <div className="instr-section-head">Navigating to a Question:</div>
        <ol className="instr-ol" start={7}>
          <li>
            To answer a question, do the following:
            <ol type="a" className="instr-sub-ol">
              <li>
                Click on the question number in the Question Palette at the right of your screen to go to
                that numbered question directly. Note that using this option does NOT save your answer to
                the current question.
              </li>
              <li>
                Click on <strong>Save &amp; Next</strong> to save your answer for the current question and
                then go to the next question.
              </li>
              <li>
                Click on <strong>Mark for Review &amp; Next</strong> to save your answer for the current
                question, mark it for review, and then go to the next question.
              </li>
            </ol>
          </li>
        </ol>

        {/* Answering */}
        <div className="instr-section-head">Answering a Question:</div>
        <ol className="instr-ol" start={8}>
          <li>
            Procedure for answering a multiple choice type question:
            <ol type="a" className="instr-sub-ol">
              <li>
                To select your answer, click on one of the option buttons <strong>1) 2) 3) 4)</strong> (or press keys 1, 2, 3, 4 on keyboard).
              </li>
              <li>
                To deselect your chosen answer, click on the button of the chosen option again or click on
                the <strong>Clear</strong> button.
              </li>
              <li>
                To change your chosen answer, click on the button of another option.
              </li>
              <li>
                To save your answer, you MUST click on the <strong>Save &amp; Next</strong> button.
              </li>
              <li>
                To mark the question for review, click on the <strong>Mark for Review &amp; Next</strong> button.
                If an answer is selected for a question that is marked for review, that answer will be considered
                in the evaluation.
              </li>
            </ol>
          </li>
          <li>
            To change an answer to a question, first select the question and then click on the new answer
            option followed by clicking on the <strong>Save &amp; Next</strong> button.
          </li>
          <li>
            Questions that are saved or marked for review after answering will ONLY be considered for
            evaluation.
          </li>
        </ol>

        {/* Agree & Proceed */}
        <div className="instr-footer-box">
          <label className="instr-agree-label">
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
            />
            I have read and understood the instructions. I agree not to indulge in any unfair means.
          </label>
          <button
            className="instr-proceed-btn"
            disabled={!agreed}
            onClick={() => navigate(`/test/${testId}/attempt`)}
          >
            Proceed &gt;&gt;
          </button>
        </div>

      </div>{/* end instr-body */}

      {/* Footer */}
      <div className="instr-page-footer">
        © 2026 National Testing Agency | NEET CBT Practice Portal
      </div>
    </div>
  );
}
