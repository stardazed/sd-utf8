/**
 * @stardazed/utf8 - encode and decode utf8 sequences
 * Part of Stardazed
 * (c) 2018 by Arthur Langereis - @zenmumbler
 * https://github.com/stardazed/sd-utf8
 */

/**
 * Options controlling encoding behaviour
 */
export interface UTF8EncodeOptions {
	/**
	 * if set, force usage of the polyfill implementation
	 */
	forceUsePolyfill?: boolean;
}

/**
 * Encode a string as a utf8 byte sequence
 * @param source the string to encode
 * @param options optional settings to control encoding behaviour
 * @returns a buffer view on the encoded sequence
 */
export declare function utf8Encode(source: string, options?: UTF8EncodeOptions): Uint8Array;

/**
 * Options controlling decoding behaviour
 */
export interface UTF8DecodeOptions {
	/**
	 * if set, ignore the optional byte order mark (0xFEFF) at the beginning of the data
	 */
	ignoreBOM?: boolean;
	/**
	 * if set, force usage of the polyfill implementation
	 */
	forceUsePolyfill?: boolean;
}

/**
 * Decode a string from a utf8 byte sequence
 * @param source the buffer or buffer view with the utf8 data
 * @param options optional settings to control decoding behaviour
 * @returns the decoded string
 */
export declare function utf8Decode(source: ArrayBuffer | ArrayBufferView, options?: UTF8DecodeOptions): string;
