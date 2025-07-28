// @ts-check
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import tsParser from '@typescript-eslint/parser';

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
  recommendedConfig: js.configs.recommended
});

const eslintConfig = [
  {
    ignores: [
      'node_modules/',
      '.next/',
      'out/',
      'build/',
      'dist/',
      'public/sw.js'
    ]
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      }
    }
  },
  ...compat.extends(
    'plugin:@next/next/recommended',
    'plugin:@next/next/core-web-vitals',
    'prettier'
  ),
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      // Disable parsing error rules
      'no-undef': 'off',
      'no-unused-vars': 'off',

      // General code quality
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-template': 'error',

      // Allow img elements (disable Next.js img rule)
      '@next/next/no-img-element': 'off',

      // Disable syntax error rules that cause parsing issues
      'no-unexpected-multiline': 'off',
      'no-unreachable': 'off'
    }
  }
];

export default eslintConfig;
