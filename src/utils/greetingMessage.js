// src/utils/greetingMessage.js — 시간대 + 날짜 기반 인사 메시지

export function getGreetingMessage() {
  const now = new Date();
  const hour = now.getHours();
  const month = now.getMonth() + 1;
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);

  const morning = [
    "상쾌한 아침이에요 ☀️",
    "좋은 아침이에요 🌅",
    "활기찬 하루를 시작해봐요",
    "오늘도 힘찬 하루 되세요",
    "아침 공기가 맑은 날이에요",
  ];
  const daytime = [
    "바람이 솔솔 부는 오전이에요 🍃",
    "햇살 좋은 오전이에요 🌤",
    "오늘 하루도 순조로워요",
    "포근한 오전이에요",
    "활기찬 오전 보내고 계시죠?",
  ];
  const afternoon = [
    "따뜻한 오후예요 ☕",
    "여유로운 점심시간이에요 🍚",
    "바람이 솔솔 부는 오후예요 🍃",
    "오후의 여유를 즐겨보세요",
    "점심 맛있게 드셨나요?",
  ];
  const evening = [
    "노을이 예쁜 저녁이에요 🌇",
    "편안한 저녁 보내세요 🌙",
    "오늘 하루도 수고하셨어요",
    "따뜻한 저녁시간이에요",
    "저녁 바람이 시원해요",
  ];
  const night = [
    "고요한 밤이에요 🌙",
    "오늘 하루도 수고 많으셨어요 ✨",
    "편안한 밤 되세요 🌜",
    "좋은 꿈 꾸세요",
    "포근한 밤이에요",
  ];

  const seasonal = [];
  if (month >= 6 && month <= 8) seasonal.push("더운 날씨 조심하세요 🌡️", "시원한 하루 보내세요 🧊");
  if (month >= 12 || month <= 2) seasonal.push("따뜻하게 입으세요 🧣", "추운 날씨 조심하세요 ❄️");
  if (month >= 3 && month <= 5) seasonal.push("봄바람이 기분 좋은 날이에요 🌸", "꽃향기 가득한 계절이에요 🌷");
  if (month >= 9 && month <= 11) seasonal.push("선선한 가을 날씨예요 🍂", "하늘이 높은 가을이에요 🍁");

  let pool;
  if (hour >= 5 && hour < 9) pool = morning;
  else if (hour >= 9 && hour < 12) pool = daytime;
  else if (hour >= 12 && hour < 17) pool = afternoon;
  else if (hour >= 17 && hour < 21) pool = evening;
  else pool = night;

  const combined = [...pool, ...seasonal];
  const index = dayOfYear % combined.length;
  return combined[index];
}
