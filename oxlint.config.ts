import { defineConfig } from "oxlint";
import fallowConfig from "./.fallowrc.json" with { type: "json" };

export default defineConfig({
  plugins: ["typescript", "react", "jsx-a11y", "oxc", "unicorn"],
  ignorePatterns: [
    "dist/**",
    "artifacts/**",
    "tools/anti-slop/rules/**",
    "tools/anti-slop/shared/**",
    "Desgin/**",
  ],
  jsPlugins: [{ name: "anti-slop", specifier: "./tools/anti-slop/index.ts" }],
  rules: {
    "max-lines-per-function": ["error", { max: fallowConfig.health.maxUnitSize, IIFEs: true }],
    "oxc/no-accumulating-spread": "error",
    "anti-slop/no-chained-type-assertions": "error",
    "anti-slop/no-reduce-accumulator-copy": "error",
    "anti-slop/require-safety-comment-for-type-assertion": "error",
  },
});
