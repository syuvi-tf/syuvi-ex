import { defineConfig } from "eslint/config";
import globals from "globals";
import js from "@eslint/js";
import jsdoc from "eslint-plugin-jsdoc"

export default defineConfig([
	{ files: ["**/*.js"], languageOptions: { globals: globals.node } },
	{ files: ["**/*.js"], plugins: { js, jsdoc }, extends: ["js/recommended"], rules: { "jsdoc/no-undefined-types": 1 } },
]);
