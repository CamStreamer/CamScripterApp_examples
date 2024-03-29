module.exports = {
    env: {
        es2021: true,
        browser: true,
        node: true,
    },
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:deprecation/recommended'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: 'tsconfig.json',
        tsconfigRootDir: __dirname,
        sourceType: 'module',
    },
    plugins: ['@typescript-eslint'],
    rules: {
        '@typescript-eslint/no-floating-promises': 'error',
        '@typescript-eslint/strict-boolean-expressions': 'error',
        '@typescript-eslint/no-unused-expressions': 'error',
        'no-unused-expressions': 'off',
        '@typescript-eslint/no-unused-vars': ['error', { vars: 'all', args: 'none', ignoreRestSiblings: false }],
        'no-unused-vars': 'off',
        '@typescript-eslint/require-await': 'error',
        'require-await': 'off',
        'no-constructor-return': 'error',
        'no-duplicate-imports': 'error',
        'no-constant-binary-expression': 'error',
        'no-eq-null': 'error',
        'no-lonely-if': 'error',
        'no-var': 'error',
        'prefer-const': 'error',
        'prefer-promise-reject-errors': 'error',
        'curly': 'error',
        'eqeqeq': 'error',
    },
    ignorePatterns: ['.eslintrc.js', 'html'],
};
