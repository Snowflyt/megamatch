import { defineConfig } from "typroof/config";

export default defineConfig({
  testFiles: "{src,test}/**/*.proof.ts",
  tsConfigFilePath: "./tsconfig.test.json",
});
