module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: 'tsconfig.json',
        tsconfigRootDir: __dirname,
        sourceType: 'module',
    },
    extends: ['@camstreamer/eslint-config/react.json'],
    root: true,
    ignorePatterns: ['.eslintrc.js', 'node_modules/**/*'],
};