/**
 * @stardazed/utf8 - encode and decode utf8 sequences
 * Part of Stardazed
 * (c) 2018 by Arthur Langereis - @zenmumbler
 * https://github.com/stardazed/sd-utf8
 */

let encoder: TextEncoder | null | undefined;
function getTextEncoder() {
	if (encoder === undefined) {
		try {
			encoder = new TextEncoder();
		}
		catch (e) {
			encoder = null;
		}
	}
	return encoder;
}

let decoder: TextDecoder | null | undefined;
function getTextDecoder() {
	if (encoder === undefined) {
		try {
			decoder = new TextDecoder();
		}
		catch (e) {
			decoder = null;
		}
	}
	return decoder;
}

interface StringSourceData {
	codepoints: Uint32Array;
	utf8ByteLength: number;
}

function preflight(source: string): StringSourceData {
	const length = source.length;
	const codepoints = new Uint32Array(length);
	let bytesForCodePoint = 0, utf8ByteLength = 0;
	let hi, lo, codepoint;
	let ix = -1;
	while (ix < length - 1) {
		hi = source.charCodeAt(++ix);
		if (hi < 0xD800 || hi > 0xDFFF) {
			codepoint = hi;
		}
		else if (hi >= 0xDC00) {
			// unexpected lower pair value range
			codepoint = 0xFFFD;
		}
		else {
			if (ix === length - 1) {
				codepoint = 0xFFFD;
			}
			else {
				lo = source.charCodeAt(++ix);
				if (lo >= 0xDC00 && lo <= 0xDFFF) {
					codepoint = 0x10000 + ((hi & 0x3FF) << 10) | (lo & 0x3FF);
				}
				else {
					codepoint = 0xFFFD;
				}
			}
		}

		codepoints[ix] = codepoint;
		bytesForCodePoint = (codepoint > 0xFFFF) ? 4 : ((codepoint > 0x7FF) ? 3 : ((codepoint > 0x7F) ? 2 : 1));
		utf8ByteLength += bytesForCodePoint;
	}
	return { codepoints, utf8ByteLength };
}

/**
 * Encode a string as a utf8 byte sequence
 * @param source the string to encode
 * @returns a buffer view with the encoded sequence
 */
export function utf8Encode(source: string) {
	const encoder = getTextEncoder();
	if (encoder) {
		return encoder.encode(source);
	}

	const { codepoints, utf8ByteLength } = preflight(source);
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

/**
 * Decode a string from a utf8 byte sequence
 * @param source the buffer or buffer view with the utf8 data
 * @returns the decoded string
 */
export function utf8Decode(source: ArrayBuffer | Uint8Array) {
	const decoder = getTextDecoder();
	if (decoder) {
		return decoder.decode(source);
	}
/*
	var result = "";
	if (!data || (data.length == 0))
		return result;

	var dix = -1, cc2c = ByteStream._CC2C;
	while(dix <= data.length - 1) {
		var sig = data[++dix];
		if(sig < 0x80)
			result += cc2c[sig];
		else if((sig & 0xE0) == 0xC0)
			result += String.fromCharCode(((sig - 0xC0) << 6) + (data[++dix] & 0x3F));
		else
			result += String.fromCharCode(((sig - 0xE0) << 12) + ((data[++dix] & 0x3F) << 6) + (data[++dix] & 0x3F));
	}
	return result;
*/
}
