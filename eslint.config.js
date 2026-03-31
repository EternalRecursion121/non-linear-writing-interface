import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
	{
		ignores: ['.svelte-kit/**', 'build/**', 'dist/**', 'data/**', '**/*.svelte', '**/*.svelte.ts']
	},
	js.configs.recommended,
	...tseslint.configs.recommended,
	...svelte.configs['flat/recommended'],
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			}
		}
	},
	{
		files: ['**/*.ts', '**/*.svelte'],
		rules: {
			'no-console': 'off'
		}
	},
	prettier
);
