/**
 * Cologne Phonetic Algorithm — core implementation.
 *
 * The algorithm maps a German word to a sequence of digits (0-9) following
 * the rule table published by Hans Joachim Postel in 1969. The mapping is
 * context-sensitive: a character's code depends on its neighbours, so the
 * table is encoded here as a function rather than a static lookup.
 */

/**
 * Single-character to code mapping for the "simple" cases. Used as a
 * fallback when no contextual rule applies. Characters not present here map
 * to nothing (the character is dropped before any digit is emitted).
 */
const SIMPLE_CODE = {
  A: '0', E: '0', I: '0', J: '0', O: '0', U: '0', Y: '0',
  B: '1',
  P: '1',
  F: '3', V: '3',
  G: '4', K: '4', Q: '4',
  L: '5',
  M: '6', N: '6',
  R: '7',
  S: '8', Z: '8',
};

/**
 * Umlauts and ß are normalized before processing. We fold them to plain
 * ASCII because the 1969 table operates on unaccented Latin letters. This is
 * the only normalization performed; case folding is handled separately.
 */
const UMLAUT_MAP = {
  Ä: 'A', Ö: 'O', Ü: 'U',
  ä: 'A', ö: 'O', ü: 'U',
  ß: 'S',
};

/**
 * Expand a string into its individual characters, returning null when the
 * input is not a string. Keeping this tiny lets the public entry point reject
 * non-strings with a clear TypeError without duplicating the check in the
 * core loop.
 *
 * @param {unknown} input
 * @returns {string[] | null}
 */
function toCharArray(input) {
  if (typeof input !== 'string') return null;
  // Array.from handles surrogate pairs correctly. The Cologne table has no
  // multi-codepoint rules, but iterating by code point avoids splitting
  // astral characters into meaningless halves.
  return Array.from(input);
}

/**
 * Apply umlaut/ß normalization to a single character. Non-umlaut characters
 * pass through unchanged.
 *
 * @param {string} ch
 * @returns {string}
 */
function normalizeChar(ch) {
  return UMLAUT_MAP[ch] ?? ch;
}

/**
 * Determine whether a character contributes a vowel code ('0').
 * Used by the contextual rules for C, D, T, X, which behave differently
 * before vowels versus consonants.
 *
 * @param {string} ch
 * @returns {boolean}
 */
function isVowel(ch) {
  return 'AEIJOUY'.includes(ch);
}

/**
 * Look up the code emitted at position `i` in the normalized upper-case
 * character array `chars`, or null if the character contributes no digit.
 *
 * The contextual rules are implemented in order of specificity. Where the
 * original specification gives overlapping conditions, the first match wins;
 * this mirrors the reference description rather than trying to reconcile
 * every ambiguity.
 *
 * @param {string[]} chars - normalized, upper-cased characters
 * @param {number} i - index of the character to encode
 * @returns {string | null} a single digit '0'-'8', or null to drop the char
 */
function codeAt(chars, i) {
  const ch = chars[i];
  const prev = i > 0 ? chars[i - 1] : '';
  const next = i < chars.length - 1 ? chars[i + 1] : '';

  // C: the trickiest letter in the table.
  if (ch === 'C') {
    // At the start, C before A, H, K, L, O, R, Q is '4'; otherwise '8'.
    if (i === 0) {
      return 'ACHKLOQR'.includes(next) ? '4' : '8';
    }
    // After S, Z -> '8' (the CZ/SZ/SC cluster).
    if (prev === 'S' || prev === 'Z') return '8';
    // Otherwise, after a non-vowel -> '4'; after a vowel -> '8' is handled
    // by the fact that C after vowel maps to '8' via the next branch.
    if (!isVowel(prev) && prev !== '') return '4';
    // C after a vowel (not S/Z, not at start) -> '8'.
    return '8';
  }

  // D, T: '2', except before C -> '8' (DC/TC cluster treated like a C).
  if (ch === 'D' || ch === 'T') {
    return next === 'C' ? '8' : '2';
  }

  // X: '48', except after C, K, Q -> just '8'.
  if (ch === 'X') {
    if (prev === 'C' || prev === 'K' || prev === 'Q') return '8';
    return '48';
  }

  // P: '1', except before H -> '3' (PH cluster sounds like F).
  if (ch === 'P') {
    return next === 'H' ? '3' : '1';
  }

  // V: '3', except at the start before a vowel -> 'F' sound still '3'.
  // (The reference table gives V as '3' universally; no special case.)

  // Fallback to the static table.
  const simple = SIMPLE_CODE[ch];
  return simple !== undefined ? simple : null;
}

/**
 * Collapse repeated identical digits, which arise both from the source word
 * (e.g. "NN") and from the X-rule emitting '48' adjacent to an '8'. The
 * specification is explicit that no two equal digits may be adjacent in the
 * output.
 *
 * @param {string} digits
 * @returns {string}
 */
function collapseRepeats(digits) {
  let out = '';
  for (const d of digits) {
    if (out[out.length - 1] !== d) out += d;
  }
  return out;
}

/**
 * Compute the Cologne phonetic code for a German word.
 *
 * @param {string} word - the word to encode
 * @returns {string} a digit string, possibly empty
 * @throws {TypeError} if `word` is not a string
 */
export function colognePhonetic(word) {
  const chars = toCharArray(word);
  if (chars === null) {
    throw new TypeError(`Expected a string, got ${typeof word}`);
  }

  // Normalize: umlaut folding + uppercase, in one pass. Umlaut lookup must
  // happen before uppercasing, because 'ß'.toUpperCase() returns 'SS'.
  const normalized = chars.map((c) => normalizeChar(c).toUpperCase());

  let digits = '';
  for (let i = 0; i < normalized.length; i++) {
    const code = codeAt(normalized, i);
    if (code !== null) digits += code;
  }

  // Leading zeros are dropped because they carry no phonetic information;
  // every vowel maps to 0, so a word starting with a vowel would otherwise
  // produce a leading 0 that adds noise without distinguishing words.
  const collapsed = collapseRepeats(digits).replace(/^0+/, '');
  return collapsed;
}
