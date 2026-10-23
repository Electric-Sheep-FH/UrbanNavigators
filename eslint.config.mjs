import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  { ignores: ['**/dist/**', '**/node_modules/**', '**/coverage/**'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.node } },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['apps/web/**'],
    languageOptions: { globals: { ...globals.browser } },
  },
  {
    files: ['**/*.spec.ts'],
    languageOptions: { globals: { ...globals.jest } },
  },

  // Architecture hexagonale (apps/disruptions) : les dépendances pointent toujours vers le domaine.
  // Toute violation fait échouer le lint, donc la CI (ADR-010).
  {
    files: ['apps/disruptions/src/domain/**/*.ts'],
    ignores: ['**/*.spec.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@nestjs/*', '@un/*', 'pg', 'amqplib'],
              message: 'Le domaine reste du TypeScript pur : ni framework, ni infrastructure, ni contrat externe.',
            },
            {
              group: ['**/application/**', '**/adapters/**'],
              message: "Le domaine ne dépend d'aucune autre couche.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ['apps/disruptions/src/application/**/*.ts'],
    ignores: ['**/*.spec.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@nestjs/*', 'pg', 'amqplib'],
              message: "L'application ne connaît que des ports, jamais l'infrastructure.",
            },
            {
              group: ['**/adapters/**'],
              message: "L'application ne dépend jamais d'un adapter : elle passe par un port.",
            },
          ],
        },
      ],
    },
  },
);
