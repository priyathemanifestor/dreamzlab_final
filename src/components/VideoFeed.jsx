import { useRef, useEffect, useState, useCallback } from 'react';
import { REAL_VIDEOS } from '../videoFeedData';
import { catInfo } from '../data';

function postCommand(iframe, func) {
  if (!iframe || !iframe.contentWindow) return;
  try {
    iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func, args: [] }), '*');
  } catch (e) { /* iframe not ready yet — ignore */ }
}

function VideoSlide({ video, muted, iframeRef }) {
  const info = catInfo(video.categories[0]);
  const src = `https://www.youtube.com/embed/${video.id}?enablejsapi=1&playsinline=1&rel=0&modestbranding=1&mute=${muted ? 1 : 0}`;

  return (
    <div className="video-slide">
      <div className="video-slide-player">
        <iframe
          ref={iframeRef}
          src={src}
          title={video.title}
          className="video-slide-iframe"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      </div>
      <div className="video-slide-info-bar">
        <div>
          <span className="dream-tag" style={{ borderColor: info.color, color: info.color }}>{info.emoji} {video.categories[0]}</span>
          <div className="video-slide-title">{video.title}</div>
          <div className="video-slide-speaker">{video.speaker} · {video.source}</div>
        </div>
        <a href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer" className="video-slide-link">
          ▶ YouTube
        </a>
      </div>
    </div>
  );
}

export default function VideoFeed() {
  const containerRef = useRef(null);
  const iframeRefs = useRef([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let best = null;
        entries.forEach((entry) => {
          if (entry.isIntersecting && (!best || entry.intersectionRatio > best.intersectionRatio)) {
            best = entry;
          }
        });
        if (best) setActiveIndex(Number(best.target.dataset.index));
      },
      { root: container, threshold: [0.6] }
    );

    const slides = container.querySelectorAll('[data-index]');
    slides.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    iframeRefs.current.forEach((iframe, i) => {
      postCommand(iframe, i === activeIndex ? 'playVideo' : 'pauseVideo');
    });
  }, [activeIndex]);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      postCommand(iframeRefs.current[activeIndex], next ? 'mute' : 'unMute');
      return next;
    });
  }, [activeIndex]);

  return (
    <div className="video-feed-wrap">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 12 }}>
        <div style={{ fontSize: '.8rem', color: '#a99bc2', lineHeight: 1.6 }}>
          Real talks from real people, matched to your dream categories. Scroll to move through the feed.
        </div>
        <div onClick={toggleMute} className="video-mute-btn">{muted ? '🔇 Unmute' : '🔊 Mute'}</div>
      </div>
      <div ref={containerRef} className="video-feed">
        {REAL_VIDEOS.map((video, i) => (
          <div key={video.id} data-index={i} className="video-slide-slot">
            <VideoSlide video={video} muted={muted} iframeRef={(el) => { iframeRefs.current[i] = el; }} />
          </div>
        ))}
      </div>
    </div>
  );
}
