@stardazed/utf8
===============
Encode and decode strings to and from utf8 byte sequences.
Will use `TextEncoder` and `TextDecoder` classes when available, otherwise
falls back to a polyfill implementation.

Installation
------------
```
npm install @stardazed/utf8
pnpm install @stardazed/utf8
yarn add @stardazed/utf8
```

Usage
-----
```ts
import { utf8Encode, utf8Decode } from "@stardazed/utf8";

// returns an Uint8Array
const encoded = utf8Encode("data⚠️ to🌈 encode😺");

// takes an ArrayBuffer, a TypedArray or a DataView, returns a string
const decoded = utf8Decode(encoded);

// You can optionally skip handling of a byte order marker
// this can fix an issue with a zero-width non-breaking-space
// (codepoint 0xFEFF) being at the beginning of your stream.
const decoded2 = utf8Decode(encoded, { ignoreBOM: true });

// For both encode and decode you can also specify you want to use
// the polyfill implementation and not the native one.
// This can be useful to have a perfectly consistent encoding across
// all platforms.
const a = utf8Encode("stuff", { forceUsePolyfill: true });
const b = utf8Decode(a, { forceUsePolyfill: true });
```

Copyright
---------
© 2018 by Arthur Langereis (@zenmumbler)

License
-------
MIT
