require("@rushstack/eslint-patch/modern-module-resolution");

module.exports = {
  root: true,
  extends: ["@toruslabs/eslint-config-typescript"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    sourceType: "module",
    ecmaVersion: 2022,
    project: "./tsconfig.json",
  },
  ignorePatterns: ["*.config.js", ".eslintrc.js", "*.mjs"],
  rules: {
    "@typescript-eslint/no-explicit-any": 1,
    "import/extensions": [
      "error",
      "ignorePackages",
      {
        "js": "never",
        "jsx": "never",
        "ts": "never",
        "tsx": "never"
      }
  ],
  },
  env: {
    es2020: true,
    browser: true,
    node: true,
  },
};
