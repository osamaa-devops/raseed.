module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: ".",
  testEnvironment: "node",
  testMatch: ["<rootDir>/test/**/*.spec.ts", "<rootDir>/test/**/*.e2e-spec.ts"],
  transform: {
    "^.+\\.ts$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.json" }],
  },
  setupFiles: ["<rootDir>/test/setup-env.ts"],
  globalSetup: "<rootDir>/test/global-setup.js",
  setupFilesAfterEnv: ["<rootDir>/test/jest-after-env.ts"],
  collectCoverageFrom: ["src/**/*.ts", "!src/main.ts", "!src/**/*.module.ts", "!src/**/*.dto.ts"],
  testTimeout: 30000,
};
