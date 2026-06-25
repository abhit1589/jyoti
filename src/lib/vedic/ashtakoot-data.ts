/** Lookup tables for North Indian Ashtakoot (36-point guna milan). */

export const GANA_TABLE = [
  0, 1, 2, 1, 0, 1, 0, 0, 2, 2, 1, 1, 0, 2, 0, 0, 0, 2, 2, 0, 1, 0, 2, 2, 1, 1, 0,
] as const;

export const YONI_TABLE = [
  0, 1, 2, 3, 3, 4, 5, 2, 5, 6, 6, 7, 8, 9, 8, 9, 10, 10, 11, 11, 12, 12, 13, 0, 12, 7, 1,
] as const;

export const NADI_TABLE = [
  0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2,
] as const;

export const VASHYA_PAIRS: Record<number, number[]> = {
  1: [5, 8],
  2: [4, 7],
  3: [6],
  4: [8, 9],
  5: [7],
  6: [3, 12],
  7: [10],
  8: [4],
  9: [12],
  10: [1, 11],
  11: [1],
  12: [10],
};

/** Sun=0, Moon=1, Mars=2, Mercury=3, Jupiter=4, Venus=5, Saturn=6 */
export const GRAHA_MAITRI: number[][] = [
  [0, 1, 1, 0, 1, -1, -1],
  [1, 0, 0, 1, 0, 0, 0],
  [1, 1, 0, -1, 1, 0, 0],
  [1, -1, 0, 0, 0, 1, 0],
  [1, 1, 1, -1, 0, -1, 0],
  [-1, -1, 0, 1, 0, 0, 1],
  [-1, -1, -1, 1, 0, 1, 0],
];

export const SIGN_LORDS = [2, 5, 3, 1, 0, 3, 5, 2, 4, 6, 6, 4] as const;

export const YONI_MATRIX: number[][] = [
  [4, 2, 2, 3, 2, 2, 2, 1, 0, 1, 3, 2, 0, 2],
  [2, 4, 3, 3, 2, 2, 2, 2, 3, 1, 2, 3, 0, 2],
  [2, 3, 4, 2, 1, 2, 1, 3, 3, 1, 2, 0, 3, 1],
  [3, 3, 2, 4, 2, 1, 1, 1, 1, 2, 2, 2, 0, 0],
  [2, 2, 1, 2, 4, 2, 1, 2, 2, 1, 0, 2, 1, 1],
  [2, 2, 2, 1, 2, 4, 0, 2, 2, 1, 2, 3, 0, 2],
  [2, 2, 1, 1, 1, 0, 4, 2, 2, 1, 2, 2, 1, 2],
  [1, 2, 3, 1, 2, 2, 2, 4, 3, 0, 3, 2, 1, 2],
  [0, 3, 3, 1, 2, 2, 2, 3, 4, 1, 2, 2, 1, 2],
  [1, 1, 1, 2, 1, 1, 1, 0, 1, 4, 1, 1, 2, 1],
  [3, 2, 2, 2, 0, 2, 2, 3, 2, 1, 4, 2, 2, 1],
  [2, 3, 0, 2, 2, 3, 2, 2, 2, 1, 2, 4, 2, 2],
  [0, 0, 3, 0, 1, 0, 1, 1, 1, 2, 2, 2, 4, 2],
  [2, 2, 1, 0, 1, 2, 2, 2, 2, 1, 1, 2, 2, 4],
];

export const YONI_NAMES = [
  "Horse",
  "Elephant",
  "Sheep",
  "Snake",
  "Dog",
  "Cat",
  "Rat",
  "Cow",
  "Buffalo",
  "Tiger",
  "Hare",
  "Monkey",
  "Lion",
  "Mongoose",
] as const;

export const GANA_NAMES = ["Deva", "Manushya", "Rakshasa"] as const;
export const NADI_NAMES = ["Adi", "Madhya", "Antya"] as const;
export const VARNA_NAMES = ["Brahmin", "Kshatriya", "Vaishya", "Shudra"] as const;
