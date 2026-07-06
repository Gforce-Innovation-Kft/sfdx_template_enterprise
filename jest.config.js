const { jestConfig } = require("@salesforce/sfdx-lwc-jest/config");

module.exports = {
  ...jestConfig,
  modulePathIgnorePatterns: ["<rootDir>/.localdevserver"],
  testPathIgnorePatterns: [
    "<rootDir>/setup.test.js",
    "<rootDir>/setup.contract.test.js"
  ]
};
