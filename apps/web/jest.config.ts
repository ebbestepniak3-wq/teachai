// jest.config.ts
import type { Config } from 'jest'
import nextJest from 'next/jest'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@teachai/types$': '<rootDir>/../../packages/types/index.ts',
  },
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: { module: 'commonjs' } }],
  },
  collectCoverageFrom: [
    'lib/grading/**/*.ts',
    '!lib/grading/**/*.d.ts',
  ],
}

export default createJestConfig(config)
