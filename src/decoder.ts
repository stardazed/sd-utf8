/**
 * utf8/decoder - decode an utf8 sequence to a string
 * Part of Stardazed
 * (c) 2018-Present by Arthur Langereis - @zenmumbler
 * https://github.com/stardazed/sd-utf8
 */

import { getTextDecoder } from "./native-decoder";

/**
 * Options controlling decoding behaviour
 */
export interface UTF8DecodeOptions {
	/**
	 * if set, ignore the optional byte order mark (0xFEFF) at the beginning of the data
	 */
	ignoreBOM?: boolean;
	/**
	 * if set, force using the polyfill implementation
	 */
	forceUsePolyfill?: boolean;
}

const enum ScanMode {
	Next = 0,
	OneMore = 1,
	TwoMore = 2,
	ThreeMore = 3
}

/**
 * Decode a string from a utf8 byte sequence
 * @param source the buffer or buffer view with the utf8 data
 * @param forceUsePolyfill optional param to force using the polyfill implementation (mostly for testing)
 * @returns the decoded string
 */
export function utf8Decode(source: BufferSource, options?: UTF8DecodeOptions) {
	if (typeof options === "undefined") {
		options = {};
	}
	if (typeof options !== "object") {
		throw new TypeError("options must be an object or undefined");
	}
	const { forceUsePolyfill, ignoreBOM } = options;

	if (forceUsePolyfill !== true) {
		const decoder = getTextDecoder({ ignoreBOM });
		if (decoder) {
			return decoder.decode(source);
		}
	}

	if (source instanceof ArrayBuffer) {
		source = new Uint8Array(source);
	}
	else if (! ArrayBuffer.isView(source)) {
		throw new TypeError("source must be an ArrayBuffer, a TypedArray or a DataView");
	}
	else if (! (source instanceof Uint8Array)) {
		// ensure we look at one byte at a time
		source = new Uint8Array(source.buffer, source.byteOffset, source.byteLength);
	}
	const length = source.byteLength;
	if (length === 0) {
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
		const byte = (source as Uint8Array)[sx];
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

		// output current codepoint
		if (mode === ScanMode.Next) {
			if (codepoint >= 0x10000) {
				codeunits[dx++] = ((codepoint - 0x10000) >> 10) | 0xD800;
				codeunits[dx++] = (codepoint & 0x3FF) | 0xDC00;
			}
			else {
				// skip BOM if at start of stream and ignoreBOM was not set
				if (dx > 0 || codepoint !== 0xFEFF || ignoreBOM === true) {
					codeunits[dx++] = codepoint;
				}
			}
		}

		// next input byte
		sx += 1;
	}

	// create a new view instead of slice(), which copies
	return codeUnitsToString(new Uint16Array(codeunits.buffer, 0, dx));
}

// this function is basically convertBytesToString from @stardazed/container
function codeUnitsToString(codeunits: Uint16Array) {
	const maxBlockSize = 65536; // max parameter array size for use in Webkit
	const strings: string[] = [];
	let unitsLeft = codeunits.length;
	let offset = 0;

	while (unitsLeft > 0) {
		const blockSize = Math.min(unitsLeft, maxBlockSize);
		const str: string = String.fromCharCode.apply(null, codeunits.subarray(offset, offset + blockSize) as unknown as number[]);
		strings.push(str);
		offset += blockSize;
		unitsLeft -= blockSize;
	}

	return strings.length === 1 ? strings[0] : strings.join("");
}
