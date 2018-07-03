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
```

Copyright
---------
© 2018 by Arthur Langereis (@zenmumbler)

License
-------
MIT
