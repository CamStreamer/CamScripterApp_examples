module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: 'tsconfig.json',
        tsconfigRootDir: ".",
        sourceType: 'module',
    },
    extends: ['@camstreamer/eslint-config'],
    root: true,
    env: {
        node: true,
        jest: true,
    },
    ignorePatterns: ['.eslintrc.js', 'html/*'],
};