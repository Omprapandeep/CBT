import { useState, useEffect } from 'react';

/**
 * Reusable image component with loading placeholder, error fallback, and click-to-zoom Lightbox.
 * Used in TestPage (exam-taking), ResultPage (review), and AdminEditTest.
 */
export default function QuestionImage({ src, alt = 'Question image', maxHeight = '300px', className = '' }) {
  const [status, setStatus] = useState('loading'); // 'loading' | 'loaded' | 'error'
  const [zoomOpen, setZoomOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setZoomOpen(false);
    };
    if (zoomOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomOpen]);

  if (!src) return null;

  return (
    <>
      <div className={`q-img-wrap ${className}`}>
        {status === 'loading' && (
          <div className="q-img-placeholder" style={{ maxHeight }}>
            <div className="q-img-shimmer" />
          </div>
        )}

        {status === 'error' && (
          <div className="q-img-error">
            <span className="q-img-error-icon">🖼</span>
            <span>Image unavailable</span>
          </div>
        )}

        <img
          src={src}
          alt={alt}
          className="q-img q-img-zoomable"
          style={{
            maxHeight,
            display: status === 'loaded' ? 'block' : 'none',
          }}
          title="Click to view full size"
          onClick={() => setZoomOpen(true)}
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
        />
        {status === 'loaded' && (
          <span className="q-img-zoom-hint" style={{ display: 'none' }} onClick={() => setZoomOpen(true)}>

          </span>
        )}
      </div>

      {/* ── Fullscreen Zoom Lightbox ── */}
      {zoomOpen && (
        <div className="q-lightbox-overlay" onClick={() => setZoomOpen(false)}>
          <div className="q-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="q-lightbox-close" onClick={() => setZoomOpen(false)} title="Close (Esc)">
              ✕
            </button>
            <img src={src} alt={alt} className="q-lightbox-img" />
            <div className="q-lightbox-caption">{alt} — Full Resolution</div>
          </div>
        </div>
      )}
    </>
  );
}
