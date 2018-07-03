/**
 * @stardazed/utf8 - encode and decode utf8 sequences
 * Part of Stardazed
 * (c) 2018 by Arthur Langereis - @zenmumbler
 * https://github.com/stardazed/sd-utf8
 */

let encoder_: TextEncoder | null | undefined;
function getTextEncoder() {
	if (encoder_ === undefined) {
		try {
			encoder_ = new TextEncoder();
		}
		catch (e) {
			encoder_ = null;
		}
	}
	return encoder_;
}

let decoder_: TextDecoder | null | undefined;
function getTextDecoder() {
	if (decoder_ === undefined) {
		try {
			decoder_ = new TextDecoder();
		}
		catch (e) {
			decoder_ = null;
		}
	}
	return decoder_;
}

interface StringSourceData {
	codepoints: Uint32Array;
	utf8ByteLength: number;
}

/**
 * Convert the source string to Unicode code points and immediately
 * determine how long the resulting utf8 byte stream will be.
 */
function preflightEncode(source: string): StringSourceData {
	const length = source.length;
	const codepoints = new Uint32Array(length); // worst case length, 1 codepoint per utf-16 code unit
	let bytesForCodePoint = 0, utf8ByteLength = 0;
	let hi, lo, codepoint;
	let sx = -1, dx = 0;
	while (sx < length - 1) {
		hi = source.charCodeAt(++sx);
		if (hi < 0xD800 || hi > 0xDFFF) {
			codepoint = hi;
		}
		else if (hi >= 0xDC00) {
			// unexpected lower pair value range
			codepoint = 0xFFFD;
		}
		else {
			if (sx === length - 1) {
				codepoint = 0xFFFD;
			}
			else {
				lo = source.charCodeAt(++sx);
				if (lo >= 0xDC00 && lo <= 0xDFFF) {
					codepoint = 0x10000 + ((hi & 0x3FF) << 10) | (lo & 0x3FF);
				}
				else {
					codepoint = 0xFFFD;
				}
			}
		}

		codepoints[dx++] = codepoint;
		bytesForCodePoint = (codepoint > 0xFFFF) ? 4 : ((codepoint > 0x7FF) ? 3 : ((codepoint > 0x7F) ? 2 : 1));
		utf8ByteLength += bytesForCodePoint;
	}

	// create a new view instead of slice(), which copies
	return { codepoints: new Uint32Array(codepoints.buffer, 0, dx), utf8ByteLength };
}

/**
 * Encode a string as a utf8 byte sequence
 * @param source the string to encode
 * @param forceUsePolyfill optional param to force using the polyfill implementation (mostly for testing)
 * @returns a buffer view with the encoded sequence
 */
export function utf8Encode(source: string, forceUsePolyfill?: boolean) {
	if (forceUsePolyfill !== true) {
		const encoder = getTextEncoder();
		if (encoder) {
			return encoder.encode(source);
		}
	}

	const { codepoints, utf8ByteLength } = preflightEncode(source);
	const data = new Uint8Array(utf8ByteLength);
	const length = codepoints.length;

	let dix = -1;
	for (let ix = 0; ix < length; ++ix) {
		const codepoint = codepoints[ix];
		if (codepoint < 0x80) {
			data[++dix] = codepoint;
		}
		else if (codepoint < 0x800) {
			data[++dix] = 0xC0 | (codepoint >> 6);
			data[++dix] = 0x80 | (codepoint & 0x3F);
		}
		else if (codepoint < 0x10000) {
			data[++dix] = 0xE0 | (codepoint >> 12);
			data[++dix] = 0x80 | ((codepoint >> 6) & 0x3F);
			data[++dix] = 0x80 | (codepoint & 0x3F);
		}
		else {
			data[++dix] = 0xF0 | ((codepoint >> 18) & 7);
			data[++dix] = 0x80 | ((codepoint >> 12) & 0x3F);
			data[++dix] = 0x80 | ((codepoint >> 6) & 0x3F);
			data[++dix] = 0x80 | (codepoint & 0x3F);
		}
	}
	return data;
}

const enum ScanMode {
	Next = 0,
	OneMore = 1,
	TwoMore = 2,
	ThreeMore = 3
}

// this function is basically convertBytesToString from @stardazed/container
function codeUnitsToString(codeunits: Uint16Array) {
	const maxBlockSize = 65536; // max parameter array size for use in Webkit
	const strings: string[] = [];
	let unitsLeft = codeunits.length;
	let offset = 0;

	while (unitsLeft > 0) {
		const blockSize = Math.min(unitsLeft, maxBlockSize);
		const str: string = String.fromCharCode.apply(null, codeunits.subarray(offset, offset + blockSize));
		strings.push(str);
		offset += blockSize;
		unitsLeft -= blockSize;
	}

	return strings.length === 1 ? strings[0] : strings.join("");
}

/**
 * Decode a string from a utf8 byte sequence
 * @param source the buffer or buffer view with the utf8 data
 * @param forceUsePolyfill optional param to force using the polyfill implementation (mostly for testing)
 * @returns the decoded string
 */
export function utf8Decode(source: ArrayBuffer | Uint8Array, forceUsePolyfill?: boolean) {
	if (forceUsePolyfill !== true) {
		const decoder = getTextDecoder();
		if (decoder) {
			return decoder.decode(source);
		}
	}

	if (source instanceof ArrayBuffer) {
		source = new Uint8Array(source);
	}
	const length = source.length;
	if (source.length === 0) {
		return "";
	}

	// worst case count of utf-16 codeunits from utf8 bytes
	// if all bytes end up as placeholders
	const codeunits = new Uint16Array(length); 

	let sx = 0, dx = 0;
	let codepoint = 0;
	let sequenceStart = 0;
	let mode = ScanMode.Next;

	while (sx < length) {
		const byte = source[sx];
		if (mode === ScanMode.Next) {
			sequenceStart = sx;
			if (byte < 0x80) {
				// 1 byte
				codepoint = byte & 0x7F;
			}
			else if ((byte & 0xE0) === 0xC0) {
				// 2 bytes
				if (length - sx > 1) {
					codepoint = (byte & 0x1F) << 6;
					mode = ScanMode.OneMore;
				}
				else {
					codepoint = 0xFFFD;
				}
			}
			else if ((byte & 0xF0) === 0xE0) {
				// 3 bytes
				if (length - sx > 2) {
					codepoint = (byte & 0x0F) << 12;
					mode = ScanMode.TwoMore;
				}
				else {
					codepoint = 0xFFFD;
				}
			}
			else {
				// 4 bytes
				if (length - sx > 3) {
					codepoint = (byte & 0x07) << 18;
					mode = ScanMode.ThreeMore;
				}
				else {
					codepoint = 0xFFFD;
				}
			}
		}
		else {
			// continuation bytes
			if ((byte & 0xC0) === 0x80) {
				mode -= 1;
				codepoint |= ((byte & 0x3F) << (6 * mode));
			}
			else {
				// output placeholder for sequence start byte
				codepoint = 0xFFFD;
				mode = ScanMode.Next;
				// rewind to sequence start byte (will be +1d after this)
				sx = sequenceStart;
			}
		}

		sx += 1;
		if (mode === ScanMode.Next) {
			if (codepoint >= 0x10000) {
				codeunits[dx++] = ((codepoint - 0x10000) >> 10) | 0xD800;
				codeunits[dx++] = (codepoint & 0x3FF) | 0xDC00;
			}
			else {
				// special case, the zero-width non-breaking space yields nothing
				if (codepoint !== 0xFEFF) {
					codeunits[dx++] = codepoint;
				}
			}
		}
	}

	// create a new view instead of slice(), which copies
	return codeUnitsToString(new Uint16Array(codeunits.buffer, 0, dx));
}
