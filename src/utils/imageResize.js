// src/utils/imageResize.js — 이미지 리사이즈 (localStorage 용량 절약)

const MAX_WIDTH = 800;
const MAX_HEIGHT = 800;
const QUALITY = 0.7;
const MAX_SIZE_BYTES = 150 * 1024; // 150KB 이하로 압축
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB 원본 제한

/**
 * File → 리사이즈된 base64 data URL
 * @param {File} file
 * @returns {Promise<string>} data:image/jpeg;base64,...
 */
export function resizeImage(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) {
      reject(new Error("이미지 파일만 첨부할 수 있어요"));
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      reject(new Error("10MB 이하의 이미지만 첨부할 수 있어요"));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        // 비율 유지하며 축소
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("이미지 처리를 지원하지 않는 환경이에요"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        // JPEG로 압축 (base64 문자열 길이 ≈ 실제 바이트 * 4/3)
        let quality = QUALITY;
        let dataUrl = canvas.toDataURL("image/jpeg", quality);

        // 용량 초과 시 추가 압축 (4/3 = 1.333 비율 적용)
        while (dataUrl.length > MAX_SIZE_BYTES * 1.333 && quality >= 0.3) {
          quality = Math.round((quality - 0.1) * 10) / 10; // 부동소수점 정리
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }

        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("이미지를 읽을 수 없어요"));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error("파일을 읽을 수 없어요"));
    reader.readAsDataURL(file);
  });
}

/**
 * base64 data URL의 대략적 byte 크기
 */
export function getBase64Size(dataUrl) {
  if (!dataUrl) return 0;
  const base64 = dataUrl.split(",")[1] || "";
  return Math.round(base64.length * 0.75);
}
