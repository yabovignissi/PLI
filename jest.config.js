module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    transform: {
      '^.+\\.ts$': 'ts-jest', 
    },
    moduleFileExtensions: ['ts', 'js'],
    testMatch: ['**/tests/**/*.spec.ts'],
    globals: {
      'ts-jest': {
        tsconfig: 'tsconfig.json', 
      },
    },
  };
  