/**
 * utf8/encoder - encode a string as an utf8 sequence
 * Part of Stardazed
 * (c) 2018-Present by Arthur Langereis - @zenmumbler
 * https://github.com/stardazed/sd-utf8
 */

/**
 * Options controlling encoding behaviour
 */
export interface UTF8EncodeOptions {
	/**
	 * if set, force using the polyfill implementation
	 */
	forceUsePolyfill?: boolean;
}

/**
 * Encode a string as a utf8 byte sequence
 * @param source the string to encode
 * @param forceUsePolyfill optional param to force using the polyfill implementation (mostly for testing)
 * @returns a buffer view with the encoded sequence
 */
export function utf8Encode(source: string, options?: UTF8EncodeOptions) {
	if (typeof source !== "string") {
		throw new TypeError("source must be a string");
	}
	if (typeof options === "undefined") {
		options = {};
	}
	if (typeof options !== "object") {
		throw new TypeError("options must be an object or undefined");
	}
	const { forceUsePolyfill } = options;

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

let encoder_: TextEncoder | null | undefined;
function getTextEncoder() {
	if (encoder_ === undefined) {
		try {
			// ensure TextEncoder is present and what we expect it to be
			encoder_ = new TextEncoder();
			const buf = encoder_.encode("test");
			if (! (buf instanceof Uint8Array) || buf.byteLength !== 4) {
				throw new TypeError();
			}
		}
		catch (e) {
			encoder_ = null;
		}
	}
	return encoder_;
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
