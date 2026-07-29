import { useState, useEffect } from 'react';
import { catInfo } from '../data';
import Tabs from './ui/Tabs';
import EmptyState from './ui/EmptyState';
import SectionLabel from './ui/SectionLabel';

function usePeopleRecommendations(dreams, posts, following) {
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // One candidate per author (their most recent post), excluding "You" and people already followed.
  const candidates = Object.values(
    posts
      .filter((p) => p.author !== 'You' && !following.includes(p.author))
      .reduce((acc, p) => {
        if (!acc[p.author] || p.createdAt > acc[p.author].createdAt) acc[p.author] = p;
        return acc;
      }, {})
  ).map((p) => ({ author: p.author, category: p.category, postTitle: p.title, postDesc: p.desc }));

  useEffect(() => {
    if (!dreams || dreams.length === 0 || candidates.length === 0) { setRecs([]); return; }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch('/api/recommend-people', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dreams: dreams.map((d) => ({ title: d.title, description: d.description, category: d.category })),
        candidates,
      }),
    })
      .then((r) => { if (!r.ok) throw new Error('request failed'); return r.json(); })
      .then((data) => { if (!cancelled) setRecs(data.recommendations || []); })
      .catch(() => { if (!cancelled) setError('Could not load AI follow suggestions right now.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify((dreams || []).map((d) => d.id)), JSON.stringify(following), posts.length]);

  return { recs, loading, error };
}

export default function SocialFeed({ dreams, posts, following, toggleLike, addComment, toggleFollow }) {
  const [filter, setFilter] = useState('all');
  const [expandedPostId, setExpandedPostId] = useState(null);
  const [newCommentText, setNewCommentText] = useState({});
  const { recs, loading: recsLoading, error: recsError } = usePeopleRecommendations(dreams, posts, following);

  let feedPosts = posts;
  if (filter === 'following') feedPosts = feedPosts.filter((p) => following.includes(p.author));
  feedPosts = [...feedPosts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const feedTabs = [
    { key: 'all', label: 'All Dreamers' },
    { key: 'following', label: `Following (${following.length})` },
  ];

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <div className="page-title">🌐 Social Feed</div>
        <div className="page-subtitle">See what other dreamers are working on — like, comment, and follow along</div>
      </div>

      {recsLoading && <div style={{ fontSize: '.8rem', color: '#a99bc2', marginBottom: 14 }}>✨ Asking Claude who's worth following…</div>}
      {recsError && <div style={{ fontSize: '.8rem', color: '#a99bc2', marginBottom: 14 }}>{recsError}</div>}
      {recs.length > 0 && (
        <>
          <SectionLabel style={{ margin: '0 0 14px' }}>PEOPLE TO FOLLOW, BASED ON YOUR DREAMS</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {recs.map((r) => {
              const post = posts.find((p) => p.author === r.author);
              if (!post) return null;
              const info = catInfo(post.category);
              return (
                <div key={r.author} className="match-card">
                  <div className="avatar" style={{ background: post.color }}>{post.initials}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '.85rem', fontWeight: 700 }}>{post.author} <span style={{ fontWeight: 400, color: '#a99bc2', fontSize: '.7rem' }}>· {info.emoji} {post.category}</span></div>
                    <div style={{ fontSize: '.78rem', color: '#f5f0ff', marginTop: 4, fontStyle: 'italic' }}>"{r.reason}"</div>
                  </div>
                  <div onClick={() => toggleFollow(r.author)} className="follow-btn" style={{ background: 'rgba(139,92,246,.13)', color: '#8b5cf6' }}>+ Follow</div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <Tabs tabs={feedTabs} active={filter} onChange={setFilter} />

      {feedPosts.length === 0 && (
        <EmptyState emoji="🌐" subtitle="No one here yet — follow some dreamers to fill this feed." />
      )}

      {feedPosts.map((post) => {
        const info = catInfo(post.category);
        const isFollowing = following.includes(post.author);
        const expanded = expandedPostId === post.id;
        return (
          <div key={post.id} className="post-card">
            <img src={info.img} alt="" className="post-img" onError={(e) => { e.target.style.display = 'none'; }} />
            <div style={{ padding: '20px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="avatar" style={{ background: post.color }}>{post.initials}</div>
                  <div>
                    <div style={{ fontSize: '.85rem', fontWeight: 700 }}>{post.author}</div>
                    <div style={{ fontSize: '.68rem', color: '#a99bc2' }}>{info.emoji} {post.category}</div>
                  </div>
                </div>
                <div
                  onClick={() => toggleFollow(post.author)}
                  className="follow-btn"
                  style={{ background: isFollowing ? 'rgba(34,197,94,.15)' : 'rgba(139,92,246,.13)', color: isFollowing ? '#22c55e' : '#8b5cf6' }}
                >{isFollowing ? '✓ Following' : '+ Follow'}</div>
              </div>
              <div style={{ fontSize: '.95rem', fontWeight: 700, marginBottom: 4 }}>{post.title}</div>
              <div style={{ fontSize: '.82rem', color: '#a99bc2', lineHeight: 1.55, marginBottom: 14 }}>{post.desc}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div onClick={() => toggleLike(post.id)} style={{ cursor: 'pointer', fontSize: '.82rem', color: '#f5f0ff', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {post.likedByMe ? '❤️' : '🤍'} {post.likes}
                </div>
                <div onClick={() => setExpandedPostId(expanded ? null : post.id)} style={{ cursor: 'pointer', fontSize: '.82rem', color: '#a99bc2', display: 'flex', alignItems: 'center', gap: 6 }}>
                  💬 {post.comments.length}
                </div>
              </div>

              {expanded && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #33254a' }}>
                  {post.comments.map((c) => (
                    <div key={c.id} style={{ fontSize: '.8rem', marginBottom: 8 }}>
                      <span style={{ fontWeight: 700 }}>{c.author}:</span> <span style={{ color: '#a99bc2' }}>{c.text}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <input
                      type="text" placeholder="Add a comment…"
                      value={newCommentText[post.id] || ''}
                      onChange={(e) => setNewCommentText({ ...newCommentText, [post.id]: e.target.value })}
                      className="input-sm" style={{ flex: 1 }}
                    />
                    <div
                      onClick={() => { addComment(post.id, newCommentText[post.id] || ''); setNewCommentText({ ...newCommentText, [post.id]: '' }); }}
                      className="btn-ghost"
                    >Post</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}
