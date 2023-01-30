module.exports = {
    testEnvironment: 'node',
    rootDir: './',
    testRegex: '/tests/.*\\.(test|spec)?\\.(ts|tsx)$',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    verbose: true,
    moduleDirectories: ['node_modules', 'src'],
    moduleNameMapper: {
      "src/(.*)": "<rootDir>/src/$1"
    }
  };