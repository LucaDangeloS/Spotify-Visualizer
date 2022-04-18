module.exports = {
    testEnvironment: 'node',
    rootDir: 'src/',
    testRegex: '/tests/.*\\.(test|spec)?\\.(ts|tsx)$',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    verbose: true,
    moduleDirectories: [
      "node_modules",
      "src"
    ]
  };