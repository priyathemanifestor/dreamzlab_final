// Curated real, official TED-channel YouTube videos, mapped to dream
// categories. Video IDs were verified via web search against official TED
// YouTube uploads (not guessed from memory) — each is a real talk by a real
// person, embedded through YouTube's own standard embed mechanism, which TED
// explicitly supports and encourages (see embed.ted.com).
//
// If YouTube ever disables embedding for one of these, the fallback "Watch on
// YouTube" link still works since it's a normal watch URL.

export const REAL_VIDEOS = [
  {
    id: 'bvAEJ8G9l9U',
    title: 'How to Find Work You Love',
    speaker: 'Scott Dinsmore',
    source: 'TED',
    categories: ['career'],
  },
  {
    id: 'qp0HIF3SfI4',
    title: 'How Great Leaders Inspire Action',
    speaker: 'Simon Sinek',
    source: 'TED',
    categories: ['startup'],
  },
  {
    id: 'UNsHMEwNm2w',
    title: 'Your Elusive Creative Genius',
    speaker: 'Elizabeth Gilbert',
    source: 'TED',
    categories: ['creative', 'music'],
  },
  {
    id: 'iG9CE55wbtY',
    title: 'Do Schools Kill Creativity?',
    speaker: 'Sir Ken Robinson',
    source: 'TED',
    categories: ['education'],
  },
  {
    id: 'H14bBuluwB8',
    title: 'Grit: The Power of Passion and Perseverance',
    speaker: 'Angela Duckworth',
    source: 'TED',
    categories: ['fitness'],
  },
  {
    id: 'n3kNlFMXslo',
    title: 'How to Gain Control of Your Free Time',
    speaker: 'Laura Vanderkam',
    source: 'TED',
    categories: ['health', 'financial'],
  },
  {
    id: 'Ks-_Mh1QhMc',
    title: 'Your Body Language May Shape Who You Are',
    speaker: 'Amy Cuddy',
    source: 'TED',
    categories: ['default', 'relationship', 'travel'],
  },
];
