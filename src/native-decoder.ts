/**
 * utf8/native-decoder - create compliant native TextDecoder objects
 * Part of Stardazed
 * (c) 2018-Present by Arthur Langereis - @zenmumbler
 * https://github.com/stardazed/sd-utf8
 */

function tryCreateTextDecoder(options: TextDecoderOptions) {
	let decoder: TextDecoder;
	try {
		// ensure TextDecoder is present and what we expect it to be
		decoder = new TextDecoder(undefined, options);
		const str = decoder.decode(new Uint8Array([116, 101, 115, 116]));
		if ((typeof str !== "string") || str !== "test") {
			throw new TypeError();
		}
		if (options.ignoreBOM === true) {
			// test that ignoreBOM is supported by the native implementation
			const str = decoder.decode(new Uint8Array([239, 187, 191, 120]));
			// bom codepoint must not be skipped
			if (str.length !== 2 || str.charCodeAt(0) !== 0xFEFF || str[1] !== "x") {
				// disable native decoder for this option
				return null;
			}
		}

		return decoder;
	}
	catch (e) {
		return null;
	}
}

let decoder_: TextDecoder | null | undefined;
let decoderNoBOM_: TextDecoder | null | undefined;

export function getTextDecoder(options: TextDecoderOptions) {
	// two decoders possible, cache both
	if (options.ignoreBOM === true) {
		if (decoderNoBOM_ === undefined) {
			decoderNoBOM_ = tryCreateTextDecoder(options);
		}
		return decoderNoBOM_;
	}

	if (decoder_ === undefined) {
		decoder_ = tryCreateTextDecoder(options);
	}
	return decoder_;
}
