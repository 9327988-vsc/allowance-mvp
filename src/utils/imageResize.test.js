// src/utils/imageResize.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import { resizeImage, getBase64Size } from "./imageResize";

// --- Canvas / Image / FileReader mock 헬퍼 ---

/** 기본 mock canvas context */
function createMockCtx() {
  return {
    drawImage: vi.fn(),
  };
}

/** mock canvas: toDataURL 결과를 제어할 수 있음 */
function createMockCanvas(toDataURLResults) {
  let callIndex = 0;
  const ctx = createMockCtx();
  return {
    width: 0,
    height: 0,
    getContext: vi.fn(() => ctx),
    toDataURL: vi.fn(() => {
      if (Array.isArray(toDataURLResults)) {
        const result = toDataURLResults[callIndex] ?? toDataURLResults[toDataURLResults.length - 1];
        callIndex++;
        return result;
      }
      return toDataURLResults ?? "data:image/jpeg;base64,abc";
    }),
    _ctx: ctx,
  };
}

/** Image를 mock: onload를 즉시 호출 */
function mockImageLoad({ width = 100, height = 100, fail = false } = {}) {
  vi.spyOn(globalThis, "Image").mockImplementation(function () {
    const img = { width, height, src: "", onload: null, onerror: null };
    Object.defineProperty(img, "src", {
      set(_v) {
        if (fail) {
          setTimeout(() => img.onerror && img.onerror(), 0);
        } else {
          setTimeout(() => {
            img.width = width;
            img.height = height;
            img.onload && img.onload();
          }, 0);
        }
      },
      get() { return ""; },
    });
    return img;
  });
}

/** FileReader mock: readAsDataURL → onload 호출 */
function mockFileReaderSuccess(dataUrl = "data:image/png;base64,AAAA") {
  vi.spyOn(globalThis, "FileReader").mockImplementation(function () {
    return {
      onload: null,
      onerror: null,
      readAsDataURL() {
        setTimeout(() => this.onload && this.onload({ target: { result: dataUrl } }), 0);
      },
    };
  });
}

/** FileReader mock: readAsDataURL → onerror 호출 */
function mockFileReaderError() {
  vi.spyOn(globalThis, "FileReader").mockImplementation(function () {
    return {
      onload: null,
      onerror: null,
      readAsDataURL() {
        setTimeout(() => this.onerror && this.onerror(), 0);
      },
    };
  });
}

/** 가짜 File 생성 */
function createFakeFile({ name = "test.jpg", type = "image/jpeg", size = 5000 } = {}) {
  const file = new File(["x".repeat(size)], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

// --- 테스트 ---

describe("getBase64Size", () => {
  it("정상 data URL의 바이트 크기를 계산한다", () => {
    // base64 "AAAA" = 4글자 → 0.75 * 4 = 3 bytes
    expect(getBase64Size("data:image/jpeg;base64,AAAA")).toBe(3);
  });

  it("긴 base64 문자열의 크기를 정확히 계산한다", () => {
    const base64 = "A".repeat(1000);
    expect(getBase64Size("data:image/jpeg;base64," + base64)).toBe(750);
  });

  it("null 입력 시 0을 반환한다", () => {
    expect(getBase64Size(null)).toBe(0);
  });

  it("undefined 입력 시 0을 반환한다", () => {
    expect(getBase64Size(undefined)).toBe(0);
  });

  it("빈 문자열 입력 시 0을 반환한다", () => {
    expect(getBase64Size("")).toBe(0);
  });

  it("쉼표가 없는 문자열은 빈 base64로 처리한다", () => {
    expect(getBase64Size("no-comma-string")).toBe(0);
  });

  it("쉼표 뒤에 내용이 없으면 0을 반환한다", () => {
    expect(getBase64Size("data:image/jpeg;base64,")).toBe(0);
  });
});

describe("resizeImage", () => {
  let mockCanvas;
  const origCreateElement = document.createElement.bind(document);

  beforeEach(() => {
    mockCanvas = createMockCanvas("data:image/jpeg;base64,abc");
    vi.spyOn(document, "createElement").mockImplementation((tag) => {
      if (tag === "canvas") return mockCanvas;
      return origCreateElement(tag);
    });
  });

  describe("입력 검증", () => {
    it("null 입력 시 에러를 던진다", async () => {
      await expect(resizeImage(null)).rejects.toThrow("이미지 파일만 첨부할 수 있어요");
    });

    it("undefined 입력 시 에러를 던진다", async () => {
      await expect(resizeImage(undefined)).rejects.toThrow("이미지 파일만 첨부할 수 있어요");
    });

    it("이미지가 아닌 파일 타입이면 에러를 던진다", async () => {
      const file = createFakeFile({ type: "text/plain", name: "test.txt" });
      await expect(resizeImage(file)).rejects.toThrow("이미지 파일만 첨부할 수 있어요");
    });

    it("application/pdf 파일은 거부한다", async () => {
      const file = createFakeFile({ type: "application/pdf", name: "test.pdf" });
      await expect(resizeImage(file)).rejects.toThrow("이미지 파일만 첨부할 수 있어요");
    });

    it("10MB 초과 파일은 에러를 던진다", async () => {
      const file = createFakeFile({ type: "image/jpeg", size: 10 * 1024 * 1024 + 1 });
      await expect(resizeImage(file)).rejects.toThrow("10MB 이하의 이미지만 첨부할 수 있어요");
    });

    it("정확히 10MB 파일은 허용된다", async () => {
      const file = createFakeFile({ type: "image/jpeg", size: 10 * 1024 * 1024 });
      mockImageLoad({ width: 100, height: 100 });
      mockFileReaderSuccess();

      const result = await resizeImage(file);
      expect(result).toContain("data:image/jpeg");
    });
  });

  describe("정상 리사이즈", () => {
    it("MAX_WIDTH/MAX_HEIGHT 이하의 이미지는 원본 크기 유지", async () => {
      mockImageLoad({ width: 400, height: 300 });
      mockFileReaderSuccess();

      const file = createFakeFile({ type: "image/jpeg", size: 5000 });
      await resizeImage(file);

      expect(mockCanvas.width).toBe(400);
      expect(mockCanvas.height).toBe(300);
    });

    it("가로가 큰 이미지는 비율 유지하며 축소", async () => {
      mockImageLoad({ width: 1600, height: 800 });
      mockFileReaderSuccess();

      const file = createFakeFile({ type: "image/png", size: 5000 });
      await resizeImage(file);

      // ratio = min(800/1600, 800/800) = 0.5
      expect(mockCanvas.width).toBe(800);
      expect(mockCanvas.height).toBe(400);
    });

    it("세로가 큰 이미지는 비율 유지하며 축소", async () => {
      mockImageLoad({ width: 600, height: 1600 });
      mockFileReaderSuccess();

      const file = createFakeFile({ type: "image/jpeg", size: 5000 });
      await resizeImage(file);

      // ratio = min(800/600, 800/1600) = 0.5
      expect(mockCanvas.width).toBe(300);
      expect(mockCanvas.height).toBe(800);
    });

    it("가로 세로 모두 큰 이미지는 더 큰 쪽 기준으로 축소", async () => {
      mockImageLoad({ width: 2400, height: 1600 });
      mockFileReaderSuccess();

      const file = createFakeFile({ type: "image/jpeg", size: 5000 });
      await resizeImage(file);

      // ratio = min(800/2400, 800/1600) = min(0.333, 0.5) = 0.333
      expect(mockCanvas.width).toBe(Math.round(2400 * (800 / 2400)));
      expect(mockCanvas.height).toBe(Math.round(1600 * (800 / 2400)));
    });

    it("정확히 800x800 이미지는 축소하지 않는다", async () => {
      mockImageLoad({ width: 800, height: 800 });
      mockFileReaderSuccess();

      const file = createFakeFile({ type: "image/jpeg", size: 5000 });
      await resizeImage(file);

      expect(mockCanvas.width).toBe(800);
      expect(mockCanvas.height).toBe(800);
    });

    it("drawImage가 올바른 인자로 호출된다", async () => {
      mockImageLoad({ width: 200, height: 150 });
      mockFileReaderSuccess();

      const file = createFakeFile({ type: "image/jpeg", size: 5000 });
      await resizeImage(file);

      expect(mockCanvas._ctx.drawImage).toHaveBeenCalledWith(
        expect.anything(), 0, 0, 200, 150,
      );
    });

    it("결과 data URL을 반환한다", async () => {
      mockImageLoad({ width: 100, height: 100 });
      mockFileReaderSuccess();

      const file = createFakeFile({ type: "image/jpeg", size: 5000 });
      const result = await resizeImage(file);

      expect(result).toBe("data:image/jpeg;base64,abc");
    });

    it("image/png 파일도 처리할 수 있다", async () => {
      mockImageLoad({ width: 100, height: 100 });
      mockFileReaderSuccess();

      const file = createFakeFile({ type: "image/png", size: 5000 });
      const result = await resizeImage(file);

      expect(result).toContain("data:image/jpeg");
    });

    it("image/gif 파일도 처리할 수 있다", async () => {
      mockImageLoad({ width: 100, height: 100 });
      mockFileReaderSuccess();

      const file = createFakeFile({ type: "image/gif", size: 5000 });
      const result = await resizeImage(file);

      expect(typeof result).toBe("string");
    });
  });

  describe("추가 압축 (용량 초과 시 quality 감소)", () => {
    it("첫 toDataURL 결과가 150KB 초과 시 quality를 낮춰 재압축", async () => {
      // 150KB * 1.333 = ~200,000 글자 기준
      const largeDataUrl = "data:image/jpeg;base64," + "A".repeat(210_000);
      const smallDataUrl = "data:image/jpeg;base64," + "A".repeat(100_000);
      mockCanvas = createMockCanvas([largeDataUrl, smallDataUrl]);
      vi.spyOn(document, "createElement").mockImplementation((tag) => {
        if (tag === "canvas") return mockCanvas;
        return origCreateElement(tag);
      });

      mockImageLoad({ width: 100, height: 100 });
      mockFileReaderSuccess();

      const file = createFakeFile({ type: "image/jpeg", size: 5000 });
      const result = await resizeImage(file);

      expect(mockCanvas.toDataURL.mock.calls.length).toBeGreaterThan(1);
      expect(result).toBe(smallDataUrl);
    });

    it("quality가 0.3 미만이면 추가 압축을 중단한다", async () => {
      // 항상 큰 결과를 반환하는 canvas
      const alwaysLargeUrl = "data:image/jpeg;base64," + "A".repeat(210_000);
      mockCanvas = createMockCanvas(alwaysLargeUrl);
      vi.spyOn(document, "createElement").mockImplementation((tag) => {
        if (tag === "canvas") return mockCanvas;
        return origCreateElement(tag);
      });

      mockImageLoad({ width: 100, height: 100 });
      mockFileReaderSuccess();

      const file = createFakeFile({ type: "image/jpeg", size: 5000 });
      const result = await resizeImage(file);

      // 초기 0.7(1회) + while 루프: 0.6(2) → 0.5(3) → 0.4(4) → 0.3(5) → 0.2(6) → 종료
      expect(mockCanvas.toDataURL.mock.calls.length).toBe(6);
      expect(result).toBe(alwaysLargeUrl);
    });
  });

  describe("에러 케이스", () => {
    it("FileReader 에러 시 reject된다", async () => {
      mockFileReaderError();

      const file = createFakeFile({ type: "image/jpeg", size: 5000 });
      await expect(resizeImage(file)).rejects.toThrow("파일을 읽을 수 없어요");
    });

    it("Image 로드 에러 시 reject된다", async () => {
      mockImageLoad({ fail: true });
      mockFileReaderSuccess();

      const file = createFakeFile({ type: "image/jpeg", size: 5000 });
      await expect(resizeImage(file)).rejects.toThrow("이미지를 읽을 수 없어요");
    });

    it("canvas getContext가 null 반환 시 reject된다", async () => {
      mockCanvas = createMockCanvas("data:image/jpeg;base64,abc");
      mockCanvas.getContext = vi.fn(() => null);
      vi.spyOn(document, "createElement").mockImplementation((tag) => {
        if (tag === "canvas") return mockCanvas;
        return origCreateElement(tag);
      });

      mockImageLoad({ width: 100, height: 100 });
      mockFileReaderSuccess();

      const file = createFakeFile({ type: "image/jpeg", size: 5000 });
      await expect(resizeImage(file)).rejects.toThrow("이미지 처리를 지원하지 않는 환경이에요");
    });
  });
});
