import typescript from "@rollup/plugin-typescript";
import { babel } from '@rollup/plugin-babel';

import path from "path";
import pkg from "./package.json" assert { type: "json" };

export default {
    input: "src/index.ts",
    output: 
    [
      {
        file: pkg.main,
        format: "cjs",
        // needed for import cjs
        interop: "compat",
        exports: "named"
      },
      {
        file: pkg.module,
        format: "es",
        exports: "named"
      },
      // {
      //   dir: "dist",
      //   format: "es",
      // },
    ],
    plugins: [
      typescript({
        tsconfig: "./tsconfig.json",
        outDir: "./dist",
        declaration: true,
        exclude: ["src/**/*.spec.*"],
      }),
      babel(),
    ],
  }
 
;