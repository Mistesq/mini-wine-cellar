/** @type {import("jest").Config} */
module.exports = {
  testEnvironment: "node",
  testRegex: "\\.test\\.ts$",
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
};
