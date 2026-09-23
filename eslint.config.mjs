import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

// R2 — only src/lib/clock.ts may read the system time.
const noSystemTime = [
  {
    selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']",
    message: 'Read time via `clock.now()` (src/lib/clock.ts) or the injected `now` (R2).',
  },
  {
    selector: "NewExpression[callee.name='Date'][arguments.length=0]",
    message: 'Argument-less `new Date()` reads the system time; inject `now` instead (R2).',
  },
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'playwright-report/**',
    'test-results/**',
  ]),
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/lib/clock.ts', 'src/**/*.test.{ts,tsx}'],
    rules: { 'no-restricted-syntax': ['error', ...noSystemTime] },
  },
  // R1 — the domain is pure TypeScript: no React, Next, browser globals or outer layers.
  {
    files: ['src/features/order-tracking/domain/**/*.ts'],
    ignores: ['src/**/*.test.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-dom', 'next', 'next/*'],
              message: 'Domain is framework-free (R1).',
            },
            {
              // Aliased, barrel and relative forms alike.
              group: [
                '@/lib',
                '@/lib/*',
                '@/components',
                '@/components/*',
                '@/features/*/data',
                '@/features/*/data/*',
                '@/features/*/ui',
                '@/features/*/ui/*',
                '@/features/*/hooks',
                '@/features/*/hooks/*',
                '../data',
                '../data/*',
                '../ui',
                '../ui/*',
                '../hooks',
                '../hooks/*',
                '**/lib/*',
                '**/components/*',
              ],
              message: 'Domain may not import outer layers (R1).',
            },
          ],
        },
      ],
      'no-restricted-globals': ['error', 'window', 'document', 'localStorage', 'navigator'],
    },
  },
  // R3 — components render view models; they never read raw orders or the data layer.
  {
    files: ['src/features/order-tracking/ui/**/*.{ts,tsx}'],
    ignores: ['src/**/*.test.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              // Aliased, barrel and relative forms alike; view-model types are the one exception.
              group: [
                '@/features/order-tracking/data',
                '@/features/order-tracking/data/*',
                '@/features/order-tracking/domain/*',
                '**/data',
                '**/data/*',
                '**/domain/*',
                '!@/features/order-tracking/domain/view-model',
                '!**/domain/view-model',
              ],
              message: 'UI consumes view models via hooks only (R3).',
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
