import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toHex, fromHex, SignedMode } from '../src/core.js';

test('toHex unsigned basic', () => {
  assert.equal(toHex(0), '00');
  assert.equal(toHex(15), '0f');
  assert.equal(toHex(255), 'ff');
  assert.equal(toHex(256), '0100');
  assert.equal(toHex(0, { minBytes: 2 }), '0000');
});

test('toHex unsigned upper', () => {
  assert.equal(toHex(255, { upper: true }), 'FF');
});

test('toHex bigint', () => {
  assert.equal(toHex(0x123456789abcdef0n), '123456789abcdef0');
  assert.equal(toHex(0x123456789abcdef0n, { upper: true }), '123456789ABCDEF0');
});

test('toHex two complement non-negative', () => {
  assert.equal(toHex(0, { signedMode: SignedMode.TWO_COMPLEMENT }), '00');
  assert.equal(toHex(127, { signedMode: SignedMode.TWO_COMPLEMENT }), '7f');
  assert.equal(toHex(128, { signedMode: SignedMode.TWO_COMPLEMENT }), '0080');
  assert.equal(toHex(255, { signedMode: SignedMode.TWO_COMPLEMENT }), '00ff');
  assert.equal(toHex(256, { signedMode: SignedMode.TWO_COMPLEMENT }), '0100');
});

test('toHex two complement minBytes', () => {
  assert.equal(
    toHex(1, { signedMode: SignedMode.TWO_COMPLEMENT, minBytes: 2 }),
    '0001',
  );
  assert.equal(
    toHex(128, { signedMode: SignedMode.TWO_COMPLEMENT, minBytes: 1 }),
    '0080',
  );
});

test('toHex invalid input', () => {
  assert.throws(() => toHex(-1), RangeError);
  assert.throws(() => toHex(1.5), RangeError);
  assert.throws(() => toHex(Number.MAX_SAFE_INTEGER + 1), RangeError);
  assert.throws(() => toHex('1'), TypeError);
  assert.throws(() => toHex(1, { minBytes: 0 }), RangeError);
  assert.throws(() => toHex(1, { minBytes: 1.5 }), RangeError);
  assert.throws(() => toHex(1, { signedMode: 'invalid' }), RangeError);
});

test('fromHex unsigned basic', () => {
  assert.equal(fromHex('00'), 0n);
  assert.equal(fromHex('0f'), 15n);
  assert.equal(fromHex('ff'), 255n);
  assert.equal(fromHex('0100'), 256n);
  assert.equal(fromHex('0x1A'), 26n);
  assert.equal(fromHex(' 0X1a '), 26n);
});

test('fromHex two complement', () => {
  assert.equal(fromHex('00', { signedMode: SignedMode.TWO_COMPLEMENT }), 0n);
  assert.equal(fromHex('7f', { signedMode: SignedMode.TWO_COMPLEMENT }), 127n);
  assert.equal(fromHex('80', { signedMode: SignedMode.TWO_COMPLEMENT }), -128n);
  assert.equal(fromHex('ff', { signedMode: SignedMode.TWO_COMPLEMENT }), -1n);
  assert.equal(fromHex('0080', { signedMode: SignedMode.TWO_COMPLEMENT }), 128n);
  assert.equal(fromHex('0100', { signedMode: SignedMode.TWO_COMPLEMENT }), 256n);
});

test('fromHex invalid input', () => {
  assert.throws(() => fromHex(''), SyntaxError);
  assert.throws(() => fromHex('0x'), SyntaxError);
  assert.throws(() => fromHex('xyz'), SyntaxError);
  assert.throws(() => fromHex('12g'), SyntaxError);
  assert.throws(() => fromHex(123), TypeError);
  assert.throws(() => fromHex('12', { signedMode: 'invalid' }), RangeError);
});

test('roundtrip unsigned', () => {
  for (const n of [0n, 1n, 15n, 16n, 255n, 256n, 65535n, 65536n, 2n ** 64n - 1n]) {
    const hex = toHex(n);
    assert.equal(fromHex(hex), n);
  }
});

test('roundtrip two complement', () => {
  for (const n of [0n, 1n, 127n, 128n, 255n, 256n, 32767n, 32768n, 2n ** 63n - 1n]) {
    const hex = toHex(n, { signedMode: SignedMode.TWO_COMPLEMENT });
    assert.equal(fromHex(hex, { signedMode: SignedMode.TWO_COMPLEMENT }), n);
  }
  // Negative values roundtrip through fromHex then toHex (with unsigned input not allowed)
  for (const hex of ['80', 'ff', '8000', 'ffff', '8000000000000000']) {
    const val = fromHex(hex, { signedMode: SignedMode.TWO_COMPLEMENT });
    assert.ok(val < 0n);
    // Re-encoding a negative value is not part of the API, so just verify the parse
  }
});
