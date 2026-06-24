module.exports = {
  transform: {
    "^.+\\.ts?$": ["ts-jest", { tsconfig: "tests/tsconfig.json" }],
  },
  testEnvironment: "node",
  testMatch: [
    "**/src/**/*.test.ts",
    "**/tests/features/*.ts",
  ],
  testPathIgnorePatterns: ["/node_modules/", "\\.e2e\\.ts$"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
};
