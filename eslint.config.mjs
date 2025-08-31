// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    rules: {
      'no-undef': 'off',
      '@typescript-eslint/explicit-function-return-type': 'error',
    },
    extends: [eslint.configs.recommended],
  },
  tseslint.configs.recommended
);
