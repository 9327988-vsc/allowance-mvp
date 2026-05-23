// workers/src/lib/codeGen.js — 가족 코드 생성 (I/O/0/1 제외 6자)

const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function generateFamilyCode() {
  const arr = new Uint8Array(6);
  crypto.getRandomValues(arr);
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += ALPHABET[arr[i] % ALPHABET.length];
  }
  return code;
}
