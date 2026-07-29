// Static content and seed data for DreamzLab

export const CATEGORIES = {
  career:       { emoji: '🚀', color: '#6366f1', img: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80' },
  health:       { emoji: '💪', color: '#22c55e', img: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80' },
  creative:     { emoji: '🎨', color: '#ec4899', img: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&q=80' },
  travel:       { emoji: '✈️', color: '#0ea5e9', img: 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=600&q=80' },
  education:    { emoji: '📚', color: '#ffb703', img: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&q=80' },
  financial:    { emoji: '💰', color: '#10b981', img: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=600&q=80' },
  music:        { emoji: '🎵', color: '#a855f7', img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80' },
  startup:      { emoji: '🦄', color: '#f97316', img: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=600&q=80' },
  fitness:      { emoji: '🏃', color: '#ef4444', img: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=80' },
  relationship: { emoji: '❤️', color: '#ec4899', img: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&q=80' },
  default:      { emoji: '🌟', color: '#8b5cf6', img: 'https://images.unsplash.com/photo-1464852045489-bccb7d17fe39?w=600&q=80' },
};

export function catInfo(c) {
  return CATEGORIES[c] || CATEGORIES.default;
}

export function getCategory(title, desc) {
  const t = (title + ' ' + (desc || '')).toLowerCase();
  const has = (arr) => arr.some((w) => t.includes(w));
  if (has(['startup', 'founder', 'saas', 'product', 'venture'])) return 'startup';
  if (has(['career', 'job', 'promotion', 'resume', 'linkedin'])) return 'career';
  if (has(['marathon', 'run', 'race', '5k', 'triathlon'])) return 'fitness';
  if (has(['health', 'diet', 'nutrition', 'lose weight', 'eat'])) return 'health';
  if (has(['art', 'paint', 'draw', 'design', 'creative', 'craft'])) return 'creative';
  if (has(['travel', 'trip', 'visit', 'country', 'abroad', 'backpack'])) return 'travel';
  if (has(['learn', 'study', 'degree', 'university', 'course', 'language'])) return 'education';
  if (has(['invest', 'save', 'money', 'financial', 'wealth', 'retire'])) return 'financial';
  if (has(['music', 'song', 'album', 'guitar', 'sing', 'piano', 'record'])) return 'music';
  if (has(['relationship', 'love', 'family', 'partner', 'social', 'friend'])) return 'relationship';
  return 'default';
}

export const MILESTONE_TEMPLATES = {
  career:       ['Update resume & LinkedIn around "{title}"', 'Identify 3 target roles or companies that get you closer to {title}', 'Reach out to 5 people in your network for advice on {title}', 'Apply to 10 openings that move you toward {title}', 'Prepare and rehearse interviews aimed at {title}'],
  health:       ['Get a baseline check-up before starting "{title}"', 'Set a weekly nutrition plan that supports {title}', 'Build a daily routine built around {title}', 'Track your progress toward {title} every week', 'Celebrate the first month of consistency on {title}'],
  creative:     ['Block out weekly studio time for "{title}"', 'Study 3 works or artists that relate to {title}', 'Complete a first rough draft toward {title}', 'Share your progress on {title} for feedback', 'Finish a polished piece that delivers {title}'],
  travel:       ['Research destinations and set a budget for "{title}"', 'Book flights and accommodation for {title}', 'Sort passport, visas & insurance for {title}', 'Plan a day-by-day itinerary for {title}', 'Pack and confirm final details for {title}'],
  education:    ['Choose the course or curriculum for "{title}"', 'Set a weekly study schedule toward {title}', 'Complete the first module toward {title}', 'Practice what you need for {title} every week', 'Sit an assessment or apply what {title} required'],
  financial:    ['Set a target number and deadline for "{title}"', 'Track current spending and free up money for {title}', 'Open the right savings or investment account for {title}', 'Automate a recurring contribution toward {title}', 'Review progress toward {title} every quarter'],
  music:        ['Practice fundamentals daily toward "{title}"', 'Learn the first full piece toward {title}', 'Record a practice take of your progress on {title}', 'Get feedback from another musician on {title}', 'Perform or share the result: {title}'],
  startup:      ['Validate the problem behind "{title}" with 10 conversations', 'Sketch the smallest useful version of {title}', 'Build and ship a first prototype of {title}', 'Get {title} in front of 5 real users', 'Iterate {title} based on real feedback'],
  fitness:      ['Get a baseline fitness assessment for "{title}"', 'Follow a structured weekly training plan for {title}', 'Hit a mid-point milestone on the way to {title}', 'Do a dress-rehearsal effort for {title}', 'Complete the goal: {title}'],
  relationship: ['Set aside dedicated quality time for "{title}"', 'Have an honest conversation about {title}', 'Plan something meaningful toward {title}', 'Practice a new habit that supports {title}', 'Reflect together on progress toward {title}'],
  default:      ['Define exactly what success looks like for "{title}"', 'Break {title} into 3 concrete steps', 'Take the first small action toward {title} this week', 'Review progress on {title} after two weeks', 'Adjust the plan and keep going on {title}'],
};

export const QUOTES = [
  ['All our dreams can come true, if we have the courage to pursue them.', 'Walt Disney'],
  ['The future belongs to those who believe in the beauty of their dreams.', 'Eleanor Roosevelt'],
  ["It always seems impossible until it's done.", 'Nelson Mandela'],
  ['The secret of getting ahead is getting started.', 'Mark Twain'],
  ["Don't watch the clock; do what it does. Keep going.", 'Sam Levenson'],
  ["Believe you can and you're halfway there.", 'Theodore Roosevelt'],
  ['You are never too old to set another goal or to dream a new dream.', 'C.S. Lewis'],
];

export const AFFIRMATIONS = [
  "Today, I take one small step closer to the life I'm dreaming of.",
  'My dreams are valid, and I have what it takes to pursue them.',
  'Progress, not perfection — every milestone counts.',
  'I trust the process and celebrate how far I\'ve come.',
  'Small consistent actions compound into extraordinary results.',
  'I am capable of building the future I imagine.',
  "Today's effort is tomorrow's momentum.",
  'I give myself permission to dream big and start small.',
  "Every dream deserves a plan — I'm building mine, one step at a time.",
  'I choose courage over comfort when it comes to my goals.',
];

export function dayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  return Math.floor(diff / 86400000);
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// Formats a Date as YYYY-MM-DD in local time (not UTC — avoids the
// off-by-one-day bug you get from toISOString() near midnight).
export function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function makeMilestones(category, doneCount, title, startDate) {
  const texts = MILESTONE_TEMPLATES[category] || MILESTONE_TEMPLATES.default;
  const t = title || 'this dream';
  const base = startDate ? new Date(startDate) : new Date();
  return texts.map((tpl, i) => {
    const due = new Date(base);
    due.setDate(due.getDate() + (i + 1) * 7); // one week apart by default — editable afterward
    return {
      id: 'm' + i + '_' + Math.random().toString(36).slice(2, 7),
      text: tpl.split('{title}').join(t),
      done: i < doneCount,
      dueDate: i < doneCount ? null : toDateStr(due), // no due date needed for already-completed seed milestones
    };
  });
}

export function seedDreams() {
  const now = Date.now();
  return [
    { id: uid(), title: 'Run a marathon', description: 'Complete a full 26.2 mile marathon and cross the finish line strong, after months of consistent training.', category: 'fitness', createdAt: new Date(now - 30 * 86400000).toISOString(), milestones: makeMilestones('fitness', 3, 'Run a marathon') },
    { id: uid(), title: 'Launch my own startup', description: 'Build and launch a SaaS product that helps freelancers manage invoices and get paid faster.', category: 'startup', createdAt: new Date(now - 14 * 86400000).toISOString(), milestones: makeMilestones('startup', 2, 'Launch my own startup') },
    { id: uid(), title: 'Learn Spanish fluently', description: 'Reach conversational fluency in Spanish within a year, ahead of a long trip through South America.', category: 'education', createdAt: new Date(now - 5 * 86400000).toISOString(), milestones: makeMilestones('education', 1, 'Learn Spanish fluently') },
  ];
}

export function seedPosts() {
  const now = Date.now();
  return [
    { id: 'p1', author: 'Maya R.', initials: 'MR', color: '#6366f1', title: 'Becoming a certified yoga instructor', desc: 'Halfway through my 200-hour training — today I taught my first full class!', category: 'health', likes: 24, likedByMe: false, createdAt: new Date(now - 2 * 86400000).toISOString(), comments: [{ id: 'c1', author: 'Theo', text: 'This is amazing, so proud of you!' }] },
    { id: 'p2', author: 'Dee Okafor', initials: 'DO', color: '#f97316', title: 'Bootstrapping a plant-care app', desc: 'Shipped the first waitlist landing page last night. 40 signups in 12 hours 🌱', category: 'startup', likes: 41, likedByMe: false, createdAt: new Date(now - 1 * 86400000).toISOString(), comments: [] },
    { id: 'p3', author: 'Sam Lin', initials: 'SL', color: '#0ea5e9', title: 'Backpacking across Southeast Asia', desc: 'Booked the flights! 4 countries, 6 weeks, way outside my comfort zone.', category: 'travel', likes: 63, likedByMe: false, createdAt: new Date(now - 6 * 3600000).toISOString(), comments: [{ id: 'c2', author: 'Priya', text: 'Please post photos, take me with you 😭' }, { id: 'c3', author: 'Jon', text: 'Solo or with friends?' }] },
    { id: 'p4', author: 'Anaya Patel', initials: 'AP', color: '#a855f7', title: 'Recording my first EP', desc: 'Vocal takes for track 3 are done. Slowly turning bedroom demos into something real.', category: 'music', likes: 18, likedByMe: false, createdAt: new Date(now - 3 * 86400000).toISOString(), comments: [] },
    { id: 'p5', author: 'Marcus T.', initials: 'MT', color: '#22c55e', title: 'Training for my first triathlon', desc: 'Ran 10k without stopping for the first time today. Small win, big deal.', category: 'fitness', likes: 35, likedByMe: false, createdAt: new Date(now - 10 * 3600000).toISOString(), comments: [{ id: 'c4', author: 'Lena', text: "Let's go!! 🔥" }] },
  ];
}

export const MENTORS = [
  { id: 'mt1', name: 'Elena Vance', achievement: 'Finished 14 marathons, 3 Boston qualifiers', category: 'fitness', initials: 'EV', color: '#ef4444' },
  { id: 'mt2', name: 'Raj Malhotra', achievement: 'Built and sold a SaaS startup for 8 figures', category: 'startup', initials: 'RM', color: '#f97316' },
  { id: 'mt3', name: 'Sofia Hernandez', achievement: 'Fluent in 5 languages, polyglot coach', category: 'education', initials: 'SH', color: '#ffb703' },
  { id: 'mt4', name: 'Marcus Webb', achievement: 'Retired at 42 through disciplined investing', category: 'financial', initials: 'MW', color: '#10b981' },
  { id: 'mt5', name: 'Aiko Tanaka', achievement: 'Published illustrator for 3 major studios', category: 'creative', initials: 'AT', color: '#ec4899' },
  { id: 'mt6', name: 'Jordan Blake', achievement: 'Toured internationally as a session musician', category: 'music', initials: 'JB', color: '#a855f7' },
];

export const PODCASTS = [
  { id: 'pc1', guest: 'Elena Vance', title: 'From couch to ultramarathon: the mindset shift', duration: '38 min', category: 'fitness' },
  { id: 'pc2', guest: 'Raj Malhotra', title: "What nobody tells you about your first exit", duration: '52 min', category: 'startup' },
  { id: 'pc3', guest: 'Marcus Webb', title: 'The boring math behind early retirement', duration: '44 min', category: 'financial' },
  { id: 'pc4', guest: 'Aiko Tanaka', title: 'Turning a sketchbook habit into a career', duration: '31 min', category: 'creative' },
  { id: 'pc5', guest: 'Sofia Hernandez', title: 'How to actually get fluent, fast', duration: '40 min', category: 'education' },
];

export const DREAM_SUGGESTIONS = {
  career:       { title: 'Land my next big career move', description: "Grow into a role that stretches my skills and pays what I'm worth." },
  fitness:      { title: 'Get in the best shape of my life', description: 'Build strength and endurance through consistent training toward a real goal.' },
  creative:     { title: 'Finish and share a creative project', description: 'Turn an idea I keep putting off into something real and finished.' },
  financial:    { title: 'Build real financial freedom', description: 'Save and invest with a clear plan so money stops being a source of stress.' },
  health:       { title: 'Build sustainable healthy habits', description: 'Feel genuinely good day to day through better sleep, food, and movement.' },
  travel:       { title: 'Take the trip I keep postponing', description: "Plan and take a trip that's been on my mind for years." },
  education:    { title: 'Learn a skill that changes my options', description: 'Commit to learning something new all the way to real competence.' },
  music:        { title: "Finish a piece of music I'm proud of", description: 'Turn practice time into something I can actually share.' },
  startup:      { title: 'Turn my idea into a real project', description: 'Stop sitting on an idea and ship a first real version of it.' },
  relationship: { title: 'Deepen a relationship that matters', description: 'Invest real time and intention into a relationship I care about.' },
  default:      { title: 'Make real progress on my dream', description: 'Turn a vague hope into a concrete, trackable plan.' },
};

export const QUIZ_QUESTIONS = [
  { text: 'What excites you most right now?', options: [
    { label: '🚀 Growing my career', category: 'career' },
    { label: '💪 Health & fitness', category: 'fitness' },
    { label: '🎨 Making something creative', category: 'creative' },
    { label: '💰 Building financial freedom', category: 'financial' },
  ] },
  { text: 'How do you like to make progress?', options: [
    { label: 'Small daily habits', style: 'habits' },
    { label: 'Big bold leaps', style: 'leaps' },
    { label: 'Structured step-by-step plans', style: 'plans' },
  ] },
];

export const STORAGE_KEY = 'dreamzlab_v1_dreams';
export const POSTS_KEY = 'dreamzlab_v1_posts';
export const FOLLOW_KEY = 'dreamzlab_v1_following';
export const QUIZ_KEY = 'dreamzlab_v1_quiz_seen';
export const SUB_KEY = 'dreamzlab_v1_subscribed';
export const BOOKED_KEY = 'dreamzlab_v1_booked';
export const PLAYED_KEY = 'dreamzlab_v1_played';
export const STREAK_KEY = 'dreamzlab_v1_streak';
