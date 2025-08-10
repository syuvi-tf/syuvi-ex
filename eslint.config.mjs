// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    rules: {
      'no-undef': 'off',
    },
    extends: [eslint.configs.recommended],
  },
  tseslint.configs.recommended
);
