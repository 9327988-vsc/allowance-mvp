// src/utils/clipboard.js

export async function copyToClipboard(text) {
  if (!text || text.trim() === "") {
    return { success: false, error: "EMPTY_TEXT" };
  }

  // 모던 API
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return { success: true };
    } catch (e) {
      return { success: false, error: "CLIPBOARD_DENIED", fallbackText: text };
    }
  }

  // 레거시 폴백 (execCommand)
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    if (ok) return { success: true };
    return { success: false, error: "CLIPBOARD_UNSUPPORTED", fallbackText: text };
  } catch (e) {
    return { success: false, error: "CLIPBOARD_UNSUPPORTED", fallbackText: text };
  }
}
