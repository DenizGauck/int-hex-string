# Int Hex String

Convert unsigned integers to and from hexadecimal strings with optional two's complement signed interpretation.

```js
import { toHex, fromHex, SignedMode } from 'int-hex-string';

const hex = toHex(255, { signedMode: SignedMode.TWO_COMPLEMENT });
// hex === '00ff'

const value = fromHex('ff', { signedMode: SignedMode.TWO_COMPLEMENT });
// value === -1n
```

## Why this exists

Standard `Number.toString(16)` and `parseInt(hex, 16)` are limited to signed 32-bit or unsigned values without control over byte width. This library provides a predictable way to encode non-negative integers into hex strings of a chosen minimum length, and to decode two's complement hex strings back into signed values. The trade-off is that `toHex` only accepts non-negative inputs — encoding negative numbers directly is not supported because the required byte width is ambiguous without an explicit size parameter.

## Edge cases

- `fromHex` with `SignedMode.TWO_COMPLEMENT` interprets the high bit of the *given* hex string as the sign bit. A string like `'ff'` is -1, while `'00ff'` is 255. The length of the string matters.
- `toHex` always emits an even number of hex digits. Odd-length hex from `Number.toString` is left-padded with a zero.
- `toHex` with two's complement mode automatically widens the output so the high bit is 0, preserving the non-negative value. For example, `toHex(128, { signedMode: SignedMode.TWO_COMPLEMENT })` returns `'0080'`, not `'80'`.
- `fromHex` accepts an optional `0x` or `0X` prefix and surrounding whitespace.

## API

### `toHex(value, options?)`

- `value`: non-negative safe integer (`number`) or `bigint`.
- `options.minBytes`: minimum number of bytes in the output (default 1).
- `options.upper`: use uppercase hex digits (default false).
- `options.signedMode`: `SignedMode.UNSIGNED` (default) or `SignedMode.TWO_COMPLEMENT`.
- Returns a hex string without a `0x` prefix.

### `fromHex(hex, options?)`

- `hex`: string, optionally with `0x`/`0X` prefix and whitespace.
- `options.signedMode`: `SignedMode.UNSIGNED` (default) or `SignedMode.TWO_COMPLEMENT`.
- Returns a `bigint`.

### `SignedMode`

Object with two frozen string values: `'unsigned'` and `'two-complement'`.

## Performance

The window keeps a bounded buffer, so `push` is constant time and memory does not
grow with the length of the stream. `peak` and `trough` are linear in the window
size, which is the trade that keeps `push` cheap.

## Limitations

Values are coerced to floats, so very large integers lose precision. If you need
exact integer aggregates over a window, this is the wrong tool.

