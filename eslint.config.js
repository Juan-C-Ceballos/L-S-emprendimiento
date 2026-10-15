import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  globalIgnores([
    'dist',
    'coverage',
    'prototype',
    'supabase',
    'src/components/ui', // código de shadcn
    'src/types/database.ts', // generado
  ]),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      reactHooks.configs.flat['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
    },
  },
  {
    // Las pantallas solo consumen servicios: nadie más que src/services/** habla con Supabase.
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/services/**', 'src/lib/supabase.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@supabase/supabase-js',
              message: 'Solo src/services/** y src/lib/supabase.ts hablan con Supabase.',
            },
          ],
          patterns: [
            {
              regex: '^(@/lib/supabase|(\\.{1,2}/)+(lib/)?supabase)$',
              message: 'Usá un servicio de src/services/: las pantallas no consultan Supabase.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['*.js'],
    extends: [js.configs.recommended],
    languageOptions: { globals: globals.node },
  },
])
