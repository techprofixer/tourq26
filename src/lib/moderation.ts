/**
 * Lightweight profanity check for chat input — English and Hindi/Hinglish.
 * Tokenizes on Unicode letter/digit boundaries (so it works for Devanagari too,
 * where \b doesn't) and matches whole tokens against a fixed word list, with
 * repeated-character collapsing (e.g. "fuuuck" -> "fuck") to catch simple evasion.
 */

const ENGLISH_PROFANITY = [
  "fuck", "fucker", "fucking", "fuckin", "motherfucker", "shit", "bullshit",
  "bitch", "asshole", "ass", "bastard", "dick", "pussy", "cunt", "slut",
  "whore", "nigger", "nigga", "faggot", "fag", "cock", "twat", "wanker",
  "douchebag", "prick",
];

// Common Hindi/Hinglish profanity, transliterated (Roman script) and in Devanagari.
const HINDI_HINGLISH_PROFANITY = [
  "chutiya", "chutiye", "chutia", "chutiyapa",
  "madarchod", "madarchood", "maderchod",
  "behenchod", "behenchood", "bhenchod",
  "bhosdi", "bhosdike", "bhosdiwala", "bhosda",
  "randi", "randwa", "raand",
  "gandu", "gaandu", "gaand", "gand",
  "lund", "lauda", "laude", "loda", "lode",
  "chod", "chodu", "chudai",
  "harami", "haramzada", "haramzadi",
  "jhant", "jhaant",
  "bakchod", "bakchodi",
  "chinaal", "chinal",
  "चूतिया", "चुतिया", "मादरचोद", "भेनचोद", "बहनचोद",
  "भोसड़ी", "भोसड़ीके", "रंडी", "गांडू", "गांड", "लंड", "लौड़ा",
  "हरामी", "हरामज़ादा", "झाट", "बकचोद", "चुदाई",
];

const PROFANITY_SET = new Set(
  [...ENGLISH_PROFANITY, ...HINDI_HINGLISH_PROFANITY].map((w) => w.toLowerCase()),
);

// Caps runs of the same repeated character at `max` — e.g. collapseRuns("fuuuuck", 1) -> "fuck",
// collapseRuns("asssss", 2) -> "ass". Two max values are tried since some banned words have a
// natural doubled letter ("ass") and others don't ("fuck").
function collapseRuns(token: string, max: number): string {
  return token.replace(/(.)\1*/gu, (run, ch: string) => ch.repeat(Math.min(run.length, max)));
}

// \p{M} keeps combining marks (Devanagari matras like "ा", "ो") attached to their base letter —
// without it, \p{L}-only splitting would break Hindi words apart at every vowel sign.
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{N}\p{M}]+/u)
    .filter(Boolean);
}

export function containsProfanity(text: string): boolean {
  for (const token of tokenize(text)) {
    if (
      PROFANITY_SET.has(token) ||
      PROFANITY_SET.has(collapseRuns(token, 1)) ||
      PROFANITY_SET.has(collapseRuns(token, 2))
    ) {
      return true;
    }
  }
  return false;
}
