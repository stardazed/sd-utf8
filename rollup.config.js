// @ts-check
import typescript from "typescript";
import tsc from "rollup-plugin-typescript2";

const banner = `/**
 * @stardazed/utf8 - encode and decode utf8 sequences
 * Part of Stardazed
 * (c) 2018 by Arthur Langereis - @zenmumbler
 * https://github.com/stardazed/sd-utf8
 */`;

export default [
	{
		input: "src/sd-utf8.ts",
		output: [
			{
				file: "dist/sd-utf8.esm.js",
				format: "es",
				sourcemap: false,
				intro: banner
			},
			{
				name: "sdUTF8",
				file: "dist/sd-utf8.umd.js",
				format: "umd",
				sourcemap: false,
				intro: banner
			}
		],
		plugins: [
			tsc({
				typescript,
				cacheRoot: "build",
				include: ["src/**/*.ts"],
			})
		]
	}
];
