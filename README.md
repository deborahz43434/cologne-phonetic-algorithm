# Cologne Phonetic

A small TypeScript-free pure-ESM JavaScript implementation of the Cologne Phonetic Algorithm, which maps German words to a digit code based on pronunciation.

## Usage

```js
import { colognePhonetic } from './src/index.js';

colognePhonetic('Müller');   // '60507'
colognePhonetic('Schmidt');  // '8602'
colognePhonetic('Bäcker');   // '1474'
```

The library exports a single function, `colognePhonetic(word)`, where `word` is a string. It returns a string of digits. Non-string input throws `TypeError`.

## Why

The Cologne Phonetic Algorithm ( Kölner Phonetik ) was published by Hans Joachim Postel in 1969 as a German analogue to Soundex and Metaphone. It reduces a word to a sequence of digits 0-8 by applying a context-sensitive character mapping, then collapsing adjacent equal digits. The trade-off in this implementation: I follow the rule table as a single ordered set of conditions rather than trying to reconcile every variant and addendum that has appeared in secondary literature. Where the original description is ambiguous, the first applicable rule wins.

## Edge cases

- **Leading zeros are stripped.** Every vowel maps to 0, so words beginning with a vowel produce a leading 0 that carries no distinguishing information; it is removed.
- **Umlauts and ß are folded to ASCII** (Ä→A, Ö→O, Ü→U, ß→S) before the table is applied. No other Unicode normalization occurs; characters with no rule are silently dropped.
- **The C rule is the awkward one.** C at the start maps to 4 or 8 depending on the following letter; C after S/Z maps to 8; C after a non-vowel consonant maps to 4; C elsewhere maps to 8. The implementation applies these in that exact priority order.
- **X is special.** It normally expands to "48", but after C, K, or Q it reduces to "8" to avoid a doubled C/K/Q sound.

## Run the tests

```
node --test
```
