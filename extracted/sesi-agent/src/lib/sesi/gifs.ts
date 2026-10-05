export const SesiGifs: Record<string, string[]> = {
  excited: [
    "https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif",
    "https://media.giphy.com/media/3o7abB06u9bNzA8lu8/giphy.gif",
    "https://media.giphy.com/media/xT0xeMA62E1XIlqNb2/giphy.gif",
  ],
  happy: [
    "https://media.giphy.com/media/MDJ9IbxxvDUQM/giphy.gif",
    "https://media.giphy.com/media/ICOgUNjpvO0PC/giphy.gif",
    "https://media.giphy.com/media/11sBLVxNs7v6WA/giphy.gif",
  ],
  thinking: [
    "https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif",
    "https://media.giphy.com/media/l4FGIYByFBahEhyWQ/giphy.gif",
  ],
  love: [
    "https://media.giphy.com/media/l2JehR2GitHG48NfG/giphy.gif",
    "https://media.giphy.com/media/xUySTUZ8A2RJBqIttK/giphy.gif",
    "https://media.giphy.com/media/26gsvEF6Iy5d8QSDS/giphy.gif",
  ],
  sparkle: [
    "https://media.giphy.com/media/l0HlNQ03t5Pgk4rVe8/giphy.gif",
    "https://media.giphy.com/media/xT0xeJpnrWC4XWblEk/giphy.gif",
  ],
  celebrate: [
    "https://media.giphy.com/media/g9582DNuQppxC/giphy.gif",
    "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
    "https://media.giphy.com/media/26u4kr12SkmfEOvmk/giphy.gif",
  ],
  sad: [
    "https://media.giphy.com/media/d2lcHJTG5Tscg/giphy.gif",
    "https://media.giphy.com/media/l3q2Z6S6n4AJQlE5q/giphy.gif",
  ],
  surprised: [
    "https://media.giphy.com/media/l3q2K5jinAlChoCLS/giphy.gif",
    "https://media.giphy.com/media/xT0xeuOy2Fdu9X9eBi/giphy.gif",
  ],
};

export function pickSesiGif(text: string, persona: string): string | null {
  const lower = text.toLowerCase();

  const emotionMap: Record<string, string[]> = {
    excited: ["yay", "wow", "amazing", "perfect", "best", "love it", "omg", "oh my"],
    happy: ["happy", "glow", "shine", "beautiful", "great", "wonderful", "fantastic"],
    thinking: ["hmm", "let me think", "let me see", "analyzing", "checking"],
    love: ["love", "heart", "bestie", "best friend", "care", "hug"],
    sparkle: ["sparkle", "sparkly", "glow up", "shine shine", "radiant"],
    celebrate: ["congrats", "done", "complete", "saved", "routine saved", "found"],
    sad: ["sorry", "unfortunately", "sad", "worried", "trouble"],
    surprised: ["wow", "oh", "omg", "surprise", "incredible", "unbelievable"],
  };

  for (const [emotion, keywords] of Object.entries(emotionMap)) {
    if (keywords.some((k) => lower.includes(k))) {
      const gifs = SesiGifs[emotion];
      return gifs[Math.floor(Math.random() * gifs.length)];
    }
  }

  if (persona === "baby" && Math.random() < 0.15) {
    const emotions = ["happy", "sparkle", "love"];
    const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
    return SesiGifs[randomEmotion][Math.floor(Math.random() * SesiGifs[randomEmotion].length)];
  }

  return null;
}
