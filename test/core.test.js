import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { colognePhonetic } from '../src/index.js';

describe('colognePhonetic', () => {
  it('throws TypeError for non-string input', () => {
    assert.throws(() => colognePhonetic(42), TypeError);
    assert.throws(() => colognePhonetic(null), TypeError);
    assert.throws(() => colognePhonetic(undefined), TypeError);
  });

  it('returns empty string for empty input', () => {
    assert.equal(colognePhonetic(''), '');
  });

  it('drops characters that have no mapping', () => {
    assert.equal(colognePhonetic('!@#$'), '');
  });

  it('treats a leading vowel as leading-zero (dropped)', () => {
    // 'A' -> '0', collapsed and stripped.
    assert.equal(colognePhonetic('A'), '');
    assert.equal(colognePhonetic('Ab'), '1');
  });

  it('collapses adjacent identical digits', () => {
    // 'NN' -> '6' + '6' -> '6'.
    assert.equal(colognePhonetic('NN'), '6');
    // 'SS' -> '8' + '8' -> '8'.
    assert.equal(colognePhonetic('SS'), '8');
  });

  it('handles C at the start before A/H/K/L/O/Q/R', () => {
    // 'CA' -> C at start before A -> '4', then A -> '0' => '40'.
    assert.equal(colognePhonetic('Ca'), '40');
    // 'CH' -> C before H -> '4', H has no mapping -> '4'.
    assert.equal(colognePhonetic('Ch'), '4');
  });

  it('handles C at the start not before the special set', () => {
    // 'CB' -> C at start, next B not in special set -> '8', B -> '1' => '81'.
    assert.equal(colognePhonetic('Cb'), '81');
  });

  it('handles C after S or Z as 8', () => {
    // 'SC' -> S -> '8', C after S -> '8', collapse -> '8'.
    assert.equal(colognePhonetic('Sc'), '8');
    // 'ZC' -> Z -> '8', C after Z -> '8', collapse -> '8'.
    assert.equal(colognePhonetic('Zc'), '8');
  });

  it('handles C after a non-vowel consonant as 4', () => {
    // 'BC' -> B -> '1', C after non-vowel B -> '4' => '14'.
    assert.equal(colognePhonetic('Bc'), '14');
  });

  it('handles C after a vowel as 8', () => {
    // 'AC' -> leading vowel dropped, C after vowel -> '8' => '8'.
    assert.equal(colognePhonetic('Ac'), '8');
  });

  it('handles D and T before C as 8', () => {
    // 'DC' -> D before C -> '8', C after non-vowel D -> '4' => '84'.
    assert.equal(colognePhonetic('Dc'), '84');
    // 'TC' -> T before C -> '8', C after non-vowel T -> '4' => '84'.
    assert.equal(colognePhonetic('Tc'), '84');
  });

  it('handles D and T not before C as 2', () => {
    assert.equal(colognePhonetic('Da'), '20');
    assert.equal(colognePhonetic('Ta'), '20');
  });

  it('handles X normally as 48', () => {
    // 'AX' -> leading A dropped, X not after C/K/Q -> '48' => '48'.
    assert.equal(colognePhonetic('Ax'), '48');
  });

  it('handles X after C/K/Q as just 8', () => {
    // 'CX' -> C before X: X not in ACHKLOQR -> '8',
    // then X after C -> '8', collapse -> '8'.
    assert.equal(colognePhonetic('Cx'), '8');
    // 'KX' -> K -> '4', X after K -> '8' => '48'.
    assert.equal(colognePhonetic('Kx'), '48');
  });

  it('handles P before H as 3 (PH = F sound)', () => {
    assert.equal(colognePhonetic('Ph'), '3');
  });

  it('handles P not before H as 1', () => {
    assert.equal(colognePhonetic('Pa'), '10');
  });

  it('normalizes umlauts and ß', () => {
    // 'ä' -> 'A' -> '0' (leading, dropped) => ''.
    assert.equal(colognePhonetic('ä'), '');
    // 'ß' -> 'S' -> '8'.
    assert.equal(colognePhonetic('ß'), '8');
    // 'Bä' -> 'B' + 'A' => '1' + '0' = '10'.
    assert.equal(colognePhonetic('Bä'), '10');
  });

  it('maps G, K, Q to 4', () => {
    assert.equal(colognePhonetic('Ga'), '40');
    assert.equal(colognePhonetic('Ka'), '40');
    assert.equal(colognePhonetic('Qa'), '40');
  });

  it('maps L to 5', () => {
    assert.equal(colognePhonetic('La'), '50');
  });

  it('maps M and N to 6', () => {
    assert.equal(colognePhonetic('Ma'), '60');
    assert.equal(colognePhonetic('Na'), '60');
  });

  it('maps R to 7', () => {
    assert.equal(colognePhonetic('Ra'), '70');
  });

  it('maps S and Z to 8', () => {
    assert.equal(colognePhonetic('Sa'), '80');
    assert.equal(colognePhonetic('Za'), '80');
  });

  it('produces a full word code end-to-end', () => {
    // 'Müller' -> M, ü->U, L, L, E, R => 6,0,5,5,0,7 => collapse -> 60507.
    assert.equal(colognePhonetic('Müller'), '60507');
    // 'Schmidt' -> S,C,H,M,I,D,T
    //   S -> 8
    //   C after S -> 8 (collapse with prev)
    //   H -> none
    //   M -> 6
    //   I -> 0
    //   D not before C -> 2
    //   T not before C -> 2 (collapse with prev)
    //   => 8602
    assert.equal(colognePhonetic('Schmidt'), '8602');
  });
});
