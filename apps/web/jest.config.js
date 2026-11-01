// Plain JS so Jest loads it without ts-node, which web does not depend on.
const nextJest = require("next/jest");

const createJestConfig = nextJest({ dir: "./" });

/** @type {import("jest").Config} */
const config = {
  // Tests cover schemas and helpers, not components, so no jsdom.
  testEnvironment: "node",
  testMatch: ["<rootDir>/src/**/*.test.ts"],
};

module.exports = createJestConfig(config);
