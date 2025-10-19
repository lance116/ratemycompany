const PROHIBITED_SUBSTRINGS = [
  "nigger",
  "nigga",
  "faggot",
  "kike",
  "chink",
  "spic",
  "wetback",
  "gook",
  "coon",
  "paki",
  "raghead",
  "tranny",
  "porchmonkey",
  "zipperhead",
  "sandnigger"
];

export const containsProhibitedSlur = (input?: string | null): boolean => {
  if (!input) {
    return false;
  }
  const normalized = input.toLowerCase();
  const substituteMap: Record<string, string> = {
    "0": "o",
    "1": "i",
    "2": "z",
    "3": "e",
    "4": "a",
    "5": "s",
    "6": "g",
    "7": "t",
    "8": "b",
    "9": "g",
    "@": "a",
    "$": "s",
    "!": "i",
    "?": "",
    "*": "",
    "#": "",
    "^": "",
    "&": "",
    "_": "",
    "-": "",
    ".": "",
    ",": ""
  };

  let sanitized = "";
  for (const char of normalized) {
    if (char >= "a" && char <= "z") {
      sanitized += char;
    } else if (substituteMap[char] !== undefined) {
      sanitized += substituteMap[char];
    }
  }

  return PROHIBITED_SUBSTRINGS.some(term => sanitized.includes(term));
};

export const sanitizeUsernameInput = (input: string): string => {
  return input.trim();
};
