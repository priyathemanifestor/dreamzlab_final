import { useState, useEffect, useCallback } from 'react';
import {
  seedDreams, seedPosts, uid, makeMilestones, getCategory,
  STORAGE_KEY, POSTS_KEY, FOLLOW_KEY, QUIZ_KEY, SUB_KEY, BOOKED_KEY, PLAYED_KEY,
  STREAK_KEY, AFFIRMATIONS, dayOfYear, toDateStr,
} from './data';
import { loadJSON, saveJSON, loadFlag, saveFlag } from './storage';
import { updateStreakOnVisit } from './gamification';
import { getPermission, requestNotificationPermission, showLocalNotification } from './notifications';
import { nudgeBuddy } from './push';

const NOTIF_SHOWN_KEY = 'dreamzlab_v1_notif_shown_date';

import Sidebar from './components/Sidebar';
import Home from './components/Home';
import MyDreams from './components/MyDreams';
import AddDream from './components/AddDream';
import Progress from './components/Progress';
import SocialFeed from './components/SocialFeed';
import Mentors from './components/Mentors';
import Founders from './components/Founders';
import BingoGame from './components/BingoGame';
import QuizModal from './components/QuizModal';
import ShareModal from './components/ShareModal';

export default function App() {
  const [page, setPage] = useState('home');
  const [dreams, setDreams] = useState([]);
  const [posts, setPosts] = useState([]);
  const [following, setFollowing] = useState([]);
  const [showQuiz, setShowQuiz] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [bookedMentors, setBookedMentors] = useState([]);
  const [playedEpisodes, setPlayedEpisodes] = useState([]);
  const [bookingMsg, setBookingMsg] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [streak, setStreak] = useState({ count: 0, lastActiveDate: null });
  const [streakToast, setStreakToast] = useState(null);
  const [notifPermission, setNotifPermission] = useState('default');

  // Load persisted state on mount
  useEffect(() => {
    const d = loadJSON(STORAGE_KEY, null);
    const loadedDreams = d && d.length ? d : seedDreams();
    setDreams(loadedDreams);

    const p = loadJSON(POSTS_KEY, null);
    setPosts(p && p.length ? p : seedPosts());
    setFollowing(loadJSON(FOLLOW_KEY, []));
    setShowQuiz(!loadFlag(QUIZ_KEY));

    setIsSubscribed(loadFlag(SUB_KEY));
    setBookedMentors(loadJSON(BOOKED_KEY, []));
    setPlayedEpisodes(loadJSON(PLAYED_KEY, []));

    const prevStreak = loadJSON(STREAK_KEY, null);
    const { streak: nextStreak, streakEvent } = updateStreakOnVisit(prevStreak);
    saveJSON(STREAK_KEY, nextStreak);
    setStreak(nextStreak);

    if (streakEvent === 'continued' && nextStreak.count > 1) {
      setStreakToast(`🔥 ${nextStreak.count}-day streak!`);
      setTimeout(() => setStreakToast(null), 3500);
    }

    setNotifPermission(getPermission());

    // Fire the local "opened the app today" notification at most once per
    // day: today's affirmation, plus how many real milestones (from this
    // browser's own data) are due. Nothing is sent anywhere for this.
    const today = toDateStr(new Date());
    if (getPermission() === 'granted' && loadJSON(NOTIF_SHOWN_KEY, null) !== today) {
      const dueCount = loadedDreams.reduce((count, dream) =>
        count + dream.milestones.filter((m) => !m.done && m.dueDate && m.dueDate <= today).length, 0);
      const affirmation = AFFIRMATIONS[dayOfYear() % AFFIRMATIONS.length];
      const body = dueCount > 0
        ? `${affirmation}\n\n📅 ${dueCount} milestone${dueCount === 1 ? '' : 's'} due today.`
        : affirmation;
      showLocalNotification('✨ DreamzLab', { body, icon: '/icon-192.png', tag: 'dreamzlab-daily' });
      saveJSON(NOTIF_SHOWN_KEY, today);
    }
  }, []);

  const updateDreams = useCallback((updater) => {
    setDreams((prev) => {
      const next = updater(prev);
      saveJSON(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const enableNotifications = async () => {
    const result = await requestNotificationPermission();
    setNotifPermission(result);
  };

  const navigate = (key) => {
    setPage(key);
    setExpandedId(null);
    setConfirmDeleteId(null);
  };

  // --- Dream actions ---
  const addDream = (dream) => updateDreams((ds) => [...ds, dream]);

  const toggleMilestone = (dreamId, msId) => {
    let justCompleted = null; // { title, category } if this toggle just marked it done (not un-done)
    updateDreams((ds) => ds.map((d) => {
      if (d.id !== dreamId) return d;
      return {
        ...d,
        milestones: d.milestones.map((m) => {
          if (m.id !== msId) return m;
          const nowDone = !m.done;
          if (nowDone) justCompleted = { title: d.title, category: d.category };
          return { ...m, done: nowDone };
        }),
      };
    }));
    if (justCompleted) nudgeBuddy(justCompleted.title, justCompleted.category); // fire-and-forget, no-ops if not configured/paired
  };

  const addMilestone = (dreamId, text, dueDate) => {
    if (!text.trim()) return;
    updateDreams((ds) => ds.map((d) => d.id === dreamId
      ? { ...d, milestones: [...d.milestones, { id: uid(), text: text.trim(), done: false, dueDate: dueDate || null }] }
      : d));
  };

  const setMilestoneDueDate = (dreamId, msId, dueDate) => {
    updateDreams((ds) => ds.map((d) => (d.id === dreamId
      ? { ...d, milestones: d.milestones.map((m) => (m.id === msId ? { ...m, dueDate: dueDate || null } : m)) }
      : d)));
  };

  const deleteDream = (dreamId) => {
    updateDreams((ds) => ds.filter((d) => d.id !== dreamId));
    setConfirmDeleteId(null);
    setExpandedId(null);
  };

  // --- Social actions ---
  const persistPosts = (next) => { saveJSON(POSTS_KEY, next); setPosts(next); };
  const persistFollowing = (next) => { saveJSON(FOLLOW_KEY, next); setFollowing(next); };

  const toggleLike = (postId) =>
    persistPosts(posts.map((p) => (p.id === postId ? { ...p, likedByMe: !p.likedByMe, likes: p.likes + (p.likedByMe ? -1 : 1) } : p)));

  const addComment = (postId, text) => {
    if (!text.trim()) return;
    persistPosts(posts.map((p) => (p.id === postId
      ? { ...p, comments: [...p.comments, { id: uid(), author: 'You', text: text.trim() }] }
      : p)));
  };

  const toggleFollow = (author) =>
    persistFollowing(following.includes(author) ? following.filter((a) => a !== author) : [...following, author]);

  const shareDream = (dream) => {
    const post = {
      id: uid(), author: 'You', initials: 'YOU', color: '#8b5cf6',
      title: dream.title, desc: dream.description, category: dream.category,
      likes: 0, likedByMe: false, createdAt: new Date().toISOString(), comments: [],
    };
    persistPosts([post, ...posts]);
    setShowShareModal(false);
    navigate('social');
  };

  // --- Quiz actions ---
  const finishQuizAndAddDream = (category, title, description) => {
    saveFlag(QUIZ_KEY, true);
    const dream = { id: uid(), title, description, category, createdAt: new Date().toISOString(), milestones: makeMilestones(category, 0, title) };
    addDream(dream);
    setShowQuiz(false);
    navigate('dreams');
    setExpandedId(dream.id);
  };
  const closeQuiz = () => { saveFlag(QUIZ_KEY, true); setShowQuiz(false); };
  const openQuiz = () => setShowQuiz(true);

  // --- Premium actions ---
  const subscribe = (cycle) => { saveFlag(SUB_KEY, true); setIsSubscribed(true); setBillingCycle(cycle); };
  const cancelSubscription = () => { saveFlag(SUB_KEY, false); setIsSubscribed(false); };

  const bookMentor = (mentor) => {
    const next = [...bookedMentors, mentor.id];
    saveJSON(BOOKED_KEY, next);
    setBookedMentors(next);
    setBookingMsg(`${mentor.name} will reach out within 48 hours to schedule your session.`);
    setTimeout(() => setBookingMsg(null), 4000);
  };

  const togglePlayed = (episodeId) => {
    const next = playedEpisodes.includes(episodeId)
      ? playedEpisodes.filter((id) => id !== episodeId)
      : [...playedEpisodes, episodeId];
    saveJSON(PLAYED_KEY, next);
    setPlayedEpisodes(next);
  };

  const getProgress = (d) => (d.milestones.length ? Math.round(d.milestones.filter((m) => m.done).length / d.milestones.length * 100) : 0);

  const totalMs = dreams.reduce((a, d) => a + d.milestones.length, 0);
  const doneMs = dreams.reduce((a, d) => a + d.milestones.filter((m) => m.done).length, 0);
  const overallPct = totalMs ? Math.round((doneMs / totalMs) * 100) : 0;

  return (
    <div data-app-container>
      <div data-app-shell className="app-shell">

        {showQuiz && (
          <QuizModal onFinish={finishQuizAndAddDream} onClose={closeQuiz} />
        )}

        {showShareModal && (
          <ShareModal dreams={dreams} getProgress={getProgress} onShare={shareDream} onClose={() => setShowShareModal(false)} />
        )}

        {streakToast && <div className="streak-toast">{streakToast}</div>}

        <Sidebar page={page} navigate={navigate} hasDreams={dreams.length > 0} overallPct={overallPct} openQuiz={openQuiz} streak={streak} notifPermission={notifPermission} enableNotifications={enableNotifications} dreams={dreams} />

        <div data-main className="main">
          {page === 'home' && (
            <Home
              dreams={dreams}
              totalMs={totalMs} doneMs={doneMs} overallPct={overallPct}
              openShareModal={() => setShowShareModal(true)}
              toggleMilestone={toggleMilestone}
            />
          )}
          {page === 'dreams' && (
            <MyDreams
              dreams={dreams}
              expandedId={expandedId} setExpandedId={setExpandedId}
              confirmDeleteId={confirmDeleteId} setConfirmDeleteId={setConfirmDeleteId}
              toggleMilestone={toggleMilestone}
              addMilestone={addMilestone}
              setMilestoneDueDate={setMilestoneDueDate}
              deleteDream={deleteDream}
              getProgress={getProgress}
            />
          )}
          {page === 'add' && (
            <AddDream dreams={dreams} addDream={addDream} navigate={navigate} getProgress={getProgress} />
          )}
          {page === 'progress' && (
            <Progress dreams={dreams} getProgress={getProgress} />
          )}
          {page === 'social' && (
            <SocialFeed
              dreams={dreams}
              posts={posts} following={following}
              toggleLike={toggleLike} addComment={addComment} toggleFollow={toggleFollow}
            />
          )}
          {page === 'mentors' && (
            <Mentors
              dreams={dreams}
              isSubscribed={isSubscribed} billingCycle={billingCycle}
              subscribe={subscribe} cancelSubscription={cancelSubscription}
              bookMentor={bookMentor} bookingMsg={bookingMsg}
              bookedMentors={bookedMentors}
              togglePlayed={togglePlayed} playedEpisodes={playedEpisodes}
            />
          )}
          {page === 'founders' && <Founders />}
          {page === 'bingo' && <BingoGame dreams={dreams} toggleMilestone={toggleMilestone} />}

          <div className="footer-rule" />
          <div className="footer-text">✨ DreamzLab · Bring your dreams to reality · Built with 💜</div>
        </div>
      </div>
    </div>
  );
}
