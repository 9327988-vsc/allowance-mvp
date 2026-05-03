// src/utils/idGenerator.js

const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";

export function nanoid(length = 6) {
  let id = "";
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  for (let i = 0; i < length; i++) {
    id += ALPHABET[arr[i] % ALPHABET.length];
  }
  return id;
}

export function newExtraItemId() {
  return `ex_${nanoid(6)}`;
}

export function newCategoryId() {
  return `cat_${nanoid(6)}`;
}
