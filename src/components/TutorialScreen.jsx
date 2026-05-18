// src/components/TutorialScreen.jsx — 온보딩 튜토리얼 (스와이프 카드)

import { useState, useRef, useCallback, useEffect } from "react";

import childImg1 from "../assets/tutorial/child_1.png";
import childImg2 from "../assets/tutorial/child_2.png";
import childImg3 from "../assets/tutorial/child_3.png";
import parentImg1 from "../assets/tutorial/parent_1.png";
import parentImg2 from "../assets/tutorial/parent_2.png";
import parentImg3 from "../assets/tutorial/parent_3.png";

// 자녀용 튜토리얼 슬라이드
const CHILD_SLIDES = [
  {
    icon: "👋",
    title: "환영해요!",
    desc: "용돈 관리를 쉽고 재미있게\n시작해볼까요?",
    bg: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    image: null,
  },
  {
    icon: "📅",
    title: "캘린더에 기록해요",
    desc: "날짜를 눌러서 등교, 학원,\n특별 지출을 기록할 수 있어요",
    bg: "linear-gradient(135deg, #3b82f6, #6366f1)",
    image: childImg1,
  },
  {
    icon: "📨",
    title: "용돈을 청구해요",
    desc: "한 달 용돈이 자동 계산되고\n부모님께 제출할 수 있어요",
    bg: "linear-gradient(135deg, #10b981, #059669)",
    image: childImg2,
  },
  {
    icon: "🔔",
    title: "결과를 알려줘요",
    desc: "부모님이 승인하거나 거절하면\n알림으로 바로 알 수 있어요",
    bg: "linear-gradient(135deg, #f59e0b, #d97706)",
    image: childImg3,
  },
  {
    icon: "🚀",
    title: "준비 완료!",
    desc: "이제 용돈 관리를 시작해봐요",
    bg: "linear-gradient(135deg, #6366f1, #ec4899)",
    image: null,
  },
];

// 부모용 튜토리얼 슬라이드
const PARENT_SLIDES = [
  {
    icon: "👋",
    title: "환영해요!",
    desc: "자녀의 용돈을\n쉽게 관리할 수 있어요",
    bg: "linear-gradient(135deg, #e11d73, #8b5cf6)",
    image: null,
  },
  {
    icon: "📬",
    title: "청구를 확인해요",
    desc: "자녀가 보낸 용돈 청구를\n검토하고 승인/거절해요",
    bg: "linear-gradient(135deg, #3b82f6, #6366f1)",
    image: parentImg1,
  },
  {
    icon: "💝",
    title: "용돈을 지급해요",
    desc: "추가 지급, 자동 정기 지급을\n설정할 수 있어요",
    bg: "linear-gradient(135deg, #10b981, #059669)",
    image: parentImg2,
  },
  {
    icon: "🎯",
    title: "미션을 만들어요",
    desc: "집안일 미션을 등록하고\n완료하면 보상을 줄 수 있어요",
    bg: "linear-gradient(135deg, #f59e0b, #d97706)",
    image: parentImg3,
  },
  {
    icon: "🚀",
    title: "준비 완료!",
    desc: "이제 가족 용돈 관리를 시작해요",
    bg: "linear-gradient(135deg, #e11d73, #ec4899)",
    image: null,
  },
];

export default function TutorialScreen({ role, onComplete }) {
  const slides = role === "parent" ? PARENT_SLIDES : CHILD_SLIDES;
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef(null);
  const touchDeltaX = useRef(0);
  const [swiping, setSwiping] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const containerRef = useRef(null);
  const previewRef = useRef(null);

  const goNext = useCallback(() => {
    setShowPreview(false);
    setCurrent(prev => {
      if (prev >= slides.length - 1) return prev;
      return prev + 1;
    });
  }, [slides.length]);

  // Separate handler for finishing tutorial (avoids side effect inside updater)
  const handleFinish = useCallback(() => {
    onComplete();
  }, [onComplete]);

  const goPrev = useCallback(() => {
    setShowPreview(false);
    setCurrent(prev => (prev > 0 ? prev - 1 : prev));
  }, []);

  // 터치 스와이프
  const touchStartY = useRef(null);

  function handleTouchStart(e) {
    if (!e.touches[0]) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchDeltaX.current = 0;
    setSwiping(true);
  }

  function handleTouchMove(e) {
    if (touchStartX.current === null || !e.touches[0]) return;
    const delta = e.touches[0].clientX - touchStartX.current;
    touchDeltaX.current = delta;
    setSwipeOffset(delta);
  }

  function handleTouchEnd(e) {
    setSwiping(false);
    setSwipeOffset(0);
    // Y축 이동이 X축보다 크면 스와이프 무시 (M-9)
    const touch = e.changedTouches?.[0];
    const deltaY = touch && touchStartY.current !== null
      ? Math.abs(touch.clientY - touchStartY.current) : 0;
    const deltaX = Math.abs(touchDeltaX.current);
    if (deltaX > 60 && deltaX > deltaY) {
      if (touchDeltaX.current < 0) goNext();
      else goPrev();
    }
    touchStartX.current = null;
    touchStartY.current = null;
    touchDeltaX.current = 0;
  }

  const slide = slides[current];
  const isLast = current === slides.length - 1;

  // M-7: 키보드 내비게이션
  function handleKeyDown(e) {
    if (e.key === "ArrowRight") goNext();
    else if (e.key === "ArrowLeft") goPrev();
    else if (e.key === "Escape") onComplete();
  }

  // M-1: 컨테이너 포커스 (마운트 시 1회만)
  useEffect(() => {
    if (containerRef.current && !showPreview) containerRef.current.focus();
  }, [showPreview]);

  // 프리뷰 열릴 때 포커스 이동
  useEffect(() => {
    if (showPreview && previewRef.current) previewRef.current.focus();
  }, [showPreview]);

  return (
    <div
      className="tutorial-screen"
      style={{ background: slide.bg }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="dialog"
      aria-modal="true"
      aria-label={`튜토리얼 - ${slide.title} (${current + 1}/${slides.length})`}
      ref={containerRef}
    >
      {/* 건너뛰기 */}
      {!isLast && (
        <button className="tutorial-skip" onClick={onComplete}>
          건너뛰기
        </button>
      )}

      {/* 카드 콘텐츠 */}
      <div
        className="tutorial-card"
        style={{
          transform: swiping ? `translateX(${swipeOffset}px)` : "translateX(0)",
          transition: swiping ? "none" : "transform 0.3s ease",
        }}
      >
        <div className="tutorial-card__icon">{slide.icon}</div>
        <h1 className="tutorial-card__title">{slide.title}</h1>
        <p className="tutorial-card__desc">{slide.desc}</p>
        {slide.image && (
          <button className="tutorial-preview-btn" onClick={() => setShowPreview(true)}>
            🖼 화면 미리보기
          </button>
        )}
      </div>

      {/* 이미지 미리보기 팝업 */}
      {showPreview && slide.image && (
        <div
          className="tutorial-preview-backdrop"
          onClick={() => setShowPreview(false)}
          onKeyDown={e => { if (e.key === "Escape") { e.stopPropagation(); setShowPreview(false); } }}
          role="dialog"
          aria-modal="true"
          aria-label="화면 미리보기"
          tabIndex={-1}
          ref={previewRef}
        >
          <img
            src={slide.image}
            alt={slide.title}
            className="tutorial-preview-img"
            onClick={e => e.stopPropagation()}
            onError={e => { e.currentTarget.style.display = "none"; }}
          />
          <button className="tutorial-preview-close" onClick={() => setShowPreview(false)} aria-label="닫기">✕</button>
        </div>
      )}

      {/* 하단: 도트 + 버튼 */}
      <div className="tutorial-footer">
        <div className="tutorial-dots" role="group" aria-label={`${current + 1} / ${slides.length} 슬라이드`}>
          {slides.map((_, i) => (
            <span
              key={i}
              className={`tutorial-dot${i === current ? " tutorial-dot--active" : ""}`}
              aria-hidden="true"
            />
          ))}
        </div>
        <button className="tutorial-next-btn" onClick={isLast ? handleFinish : goNext}>
          {isLast ? "시작하기" : "다음"}
        </button>
      </div>
    </div>
  );
}
