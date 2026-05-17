// src/constants/moods.js — 오늘의 기분 상수

export const MOODS = [
  { id: "great", emoji: "😄", label: "최고" },
  { id: "good", emoji: "😊", label: "좋음" },
  { id: "okay", emoji: "😐", label: "보통" },
  { id: "sad", emoji: "😢", label: "슬픔" },
  { id: "angry", emoji: "😤", label: "화남" },
  { id: "sick", emoji: "🤒", label: "아픔" },
];

export const MOOD_MAP = Object.fromEntries(MOODS.map(m => [m.id, m]));

export function getMoodEmoji(moodId) {
  return MOOD_MAP[moodId]?.emoji || null;
}

export function getMoodLabel(moodId) {
  return MOOD_MAP[moodId]?.label || "";
}
