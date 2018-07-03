/**
 * Encode a string as a utf8 byte sequence
 * @param source the string to encode
 * @param forceUsePolyfill optional param to force using the polyfill implementation (mostly for testing)
 * @returns a buffer view with the encoded sequence
 */
export declare function utf8Encode(source: string, forceUsePolyfill?: boolean): Uint8Array;

/**
 * Decode a string from a utf8 byte sequence
 * @param source the buffer or buffer view with the utf8 data
 * @param forceUsePolyfill optional param to force using the polyfill implementation (mostly for testing)
 * @returns the decoded string
 */
export declare function utf8Decode(source: ArrayBuffer | Uint8Array, forceUsePolyfill?: boolean): string;
