export const SERMON = {
  title: "Grace in the Storm",
  date: "February 7, 2026",
  subtitle: "Finding peace amid uncertainty",
  speaker: "Pastor James Whitfield",
  church: "Cornerstone Community Church",
  duration: "48:32",
  chapters: [
    { title: "Introduction", timestamp: "00:00" },
    { title: "The Story of Peter", timestamp: "07:12" },
    { title: "When the Storm Hits", timestamp: "14:45" },
    { title: "Grace as an Anchor", timestamp: "22:30" },
    { title: "Practical Steps Forward", timestamp: "35:18" },
    { title: "Closing Prayer", timestamp: "44:00" },
  ],
  scriptures: [
    {
      reference: "Matthew 14:27–31",
      text: '"Take courage! It is I. Don\'t be afraid." … "Lord, save me!" Immediately Jesus reached out his hand and caught him.',
    },
    {
      reference: "Ephesians 2:8–9",
      text: "For it is by grace you have been saved, through faith — and this is not from yourselves, it is the gift of God — not by works, so that no one can boast.",
    },
    {
      reference: "Romans 8:28",
      text: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.",
    },
  ],
  takeaways: [
    "Grace is not earned — it is a gift that meets us in our storms, not after them.",
    "Like Peter, our eyes fix on the waves instead of Jesus. Refocusing is a daily discipline.",
    "Peace isn't the absence of storms; it's the presence of God within them.",
    "Every storm has a purpose — God uses uncertainty to deepen our trust.",
    "Community is part of God's design for resilience. Don't face the storm alone.",
  ],
  reflectionQuestions: [
    "Where in your life right now are you feeling like Peter — sinking and afraid? What does it look like to cry out, 'Lord, save me'?",
    "Think of a past storm that God brought you through. How did that season shape your faith?",
    "In what area of your life do you need to shift your focus from the waves to Jesus this week?",
    "How does knowing grace is a gift — not earned — change the way you approach God when you feel like you've failed?",
    "Who in your community is in a storm right now? How can you reach out to them this week?",
  ],
  spark: "Grace meets you in the storm, not on the other side of it.",
  weeklyChallenge:
    "This week, write down one fear that's been keeping you from trusting God fully. Then write a verse of scripture next to it — a promise that speaks directly to that fear.",
};

export const JOURNAL_ENTRIES = [
  {
    id: "1",
    date: "Feb 10, 2026",
    type: "sermon" as const,
    tag: "Sermon",
    preview: "The part about Peter stepping out of the boat really stayed with me. I've been clinging to the boat in my own life — staying safe instead of trusting...",
    sermonTitle: "Grace in the Storm",
    bookmarked: true,
    fullText:
      "The part about Peter stepping out of the boat really stayed with me. I've been clinging to the boat in my own life — staying safe instead of trusting God with the uncertainty. Pastor James asked where we're looking, and I realized I've been staring at the waves of my job situation. Today I'm choosing to look up.",
    suggestedScripture: {
      reference: "Matthew 14:29",
      text: '"Come," he said. Then Peter got down out of the boat, walked on the water and came toward Jesus.',
    },
  },
  {
    id: "2",
    date: "Feb 8, 2026",
    type: "challenge" as const,
    tag: "Challenge",
    preview: "I wrote down my fear: 'That I'm not enough.' Next to it I put Romans 8:38–39. I read it three times and something...",
    sermonTitle: "Grace in the Storm",
    bookmarked: false,
    fullText:
      "I wrote down my fear: 'That I'm not enough.' Next to it I put Romans 8:38–39. I read it three times and something shifted. I am convinced that nothing in all creation can separate me from the love of God. That's not me — that's the Word. I'm holding onto this.",
    suggestedScripture: {
      reference: "Romans 8:38–39",
      text: "For I am convinced that neither death nor life, neither angels nor demons… shall be able to separate us from the love of God.",
    },
  },
  {
    id: "3",
    date: "Jan 31, 2026",
    type: "sermon" as const,
    tag: "Sermon",
    preview: "The series on identity hit differently this week. I keep performing for God instead of resting in who He says I am. Working on it...",
    sermonTitle: "You Are Already Enough",
    bookmarked: true,
    fullText:
      "The series on identity hit differently this week. I keep performing for God instead of resting in who He says I am. Working on replacing the lies with truth — one day at a time.",
    suggestedScripture: {
      reference: "Psalm 139:14",
      text: "I praise you because I am fearfully and wonderfully made; your works are wonderful, I know that full well.",
    },
  },
];

export const PREVIOUS_SERMONS_COUNT = 12;
