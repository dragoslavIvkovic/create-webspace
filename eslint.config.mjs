import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-plugin-prettier';
import eslintPluginAstro from 'eslint-plugin-astro';
import tseslint from 'typescript-eslint';

/**
 * Astro 6 + TypeScript flat config.
 * Bazirano na: https://cosmicthemes.com/blog/astro-eslint-prettier-setup/
 * (bez prettier-plugin-tailwindcss — projekat ne koristi Tailwind)
 */
export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', '.astro/**', 'public/**'],
  },
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { prettier },
    rules: {
      'prettier/prettier': 'off',
    },
  },
  ...eslintPluginAstro.configs.recommended,
  ...eslintPluginAstro.configs['jsx-a11y-recommended'],
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
);
