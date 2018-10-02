module.exports = {
  verbose: true,
  transform: { '^.+\\.js$': '<rootDir>/jest-preprocess.js' },
  testRegex: '(/__tests__/.*\\.(jsx?)|(\\.|/)(test|spec))\\.(jsx?)$',
  testPathIgnorePatterns: ['node_modules'],
  setupFiles: ['<rootDir>/node_modules/regenerator-runtime/runtime'],
}
