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
  return PROHIBITED_SUBSTRINGS.some(term => normalized.includes(term));
};

export const sanitizeUsernameInput = (input: string): string => {
  return input.trim();
};
