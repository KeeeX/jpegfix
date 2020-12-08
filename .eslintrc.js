const eslintConfig = require("@keeex/eslint-config");
const config = eslintConfig({typescript: "./tsconfig.json"});
config.overrides = config.overrides || [];
config.overrides.push({
  files: ["src/tests/**/*"],
  env: {mocha: true},
  plugins: ["mocha"],
});
module.exports = eslintConfig({typescript: "./tsconfig.json"});
