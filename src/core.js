/**
 * Mode for interpreting a number as signed or unsigned.
 */
export const SignedMode = Object.freeze({
  UNSIGNED: 'unsigned',
  TWO_COMPLEMENT: 'two-complement',
});

/**
 * Convert an unsigned integer to a hexadecimal string.
 *
 * @param {number|bigint} value - The unsigned integer to convert. Must be a
 *   non-negative safe integer if a number, or a non-negative bigint.
 * @param {object} [options]
 * @param {number} [options.minBytes=1] - Minimum number of bytes to emit,
 *   zero-padding on the left as needed.
 * @param {boolean} [options.upper=false] - Use uppercase hex digits.
 * @param {SignedMode} [options.signedMode=SignedMode.UNSIGNED] - How to
 *   interpret the value. UNSIGNED simply writes the value in hex.
 *   TWO_COMPLEMENT writes the smallest two's-complement representation that
 *   preserves the value as signed (negative values are not allowed here).
 * @returns {string} Hex string without a `0x` prefix.
 */
export function toHex(value, options = {}) {
  const {
    minBytes = 1,
    upper = false,
    signedMode = SignedMode.UNSIGNED,
  } = options;

  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new RangeError('value must be a non-negative safe integer');
    }
    value = BigInt(value);
  } else if (typeof value !== 'bigint') {
    throw new TypeError('value must be a number or bigint');
  }

  if (value < 0n) {
    throw new RangeError('value must be non-negative');
  }

  if (!Number.isInteger(minBytes) || minBytes < 1) {
    throw new RangeError('minBytes must be a positive integer');
  }

  let hex = value.toString(16);
  if (hex.length % 2 !== 0) {
    hex = '0' + hex;
  }

  if (signedMode === SignedMode.TWO_COMPLEMENT) {
    // For non-negative values, two's complement is identical to unsigned,
    // except that we must ensure the top bit is 0 to avoid a negative sign.
    const minBits = value === 0n ? 1n : BigInt(value.toString(2).length + 1);
    const minSignedBytes = Math.max(1, Math.ceil(Number(minBits) / 8));
    const bytes = Math.max(minBytes, minSignedBytes);
    hex = hex.padStart(bytes * 2, '0');
  } else if (signedMode === SignedMode.UNSIGNED) {
    const bytes = Math.max(minBytes, Math.ceil(hex.length / 2));
    hex = hex.padStart(bytes * 2, '0');
  } else {
    throw new RangeError(
      `signedMode must be one of ${SignedMode.UNSIGNED}, ${SignedMode.TWO_COMPLEMENT}`,
    );
  }

  return upper ? hex.toUpperCase() : hex;
}

/**
 * Parse a hexadecimal string to an unsigned integer.
 *
 * @param {string} hex - Hex string, optionally with leading `0x` or `0X`.
 * @param {object} [options]
 * @param {SignedMode} [options.signedMode=SignedMode.UNSIGNED] - How to
 *   interpret the hex string. UNSIGNED treats the entire string as a
 *   non-negative number. TWO_COMPLEMENT treats the string as a two's
 *   complement encoding, allowing negative results.
 * @returns {bigint} The parsed value. Always a bigint.
 */
export function fromHex(hex, options = {}) {
  const { signedMode = SignedMode.UNSIGNED } = options;

  if (typeof hex !== 'string') {
    throw new TypeError('hex must be a string');
  }

  let cleaned = hex.trim();
  if (cleaned.startsWith('0x') || cleaned.startsWith('0X')) {
    cleaned = cleaned.slice(2);
  }

  if (!/^[0-9a-fA-F]+$/.test(cleaned)) {
    throw new SyntaxError('hex string contains non-hex characters');
  }

  if (cleaned.length === 0) {
    throw new SyntaxError('hex string is empty');
  }

  let value = BigInt('0x' + cleaned);

  if (signedMode === SignedMode.TWO_COMPLEMENT) {
    // If the high bit of the first byte is set, the value is negative.
    // We must know the total bit length, which is the number of hex digits
    // times 4. The sign bit is the most significant bit of that width.
    const bitLength = cleaned.length * 4;
    const signBit = 1n << BigInt(bitLength - 1);
    if ((value & signBit) !== 0n) {
      const modulus = 1n << BigInt(bitLength);
      value -= modulus;
    }
  } else if (signedMode !== SignedMode.UNSIGNED) {
    throw new RangeError(
      `signedMode must be one of ${SignedMode.UNSIGNED}, ${SignedMode.TWO_COMPLEMENT}`,
    );
  }

  return value;
}
