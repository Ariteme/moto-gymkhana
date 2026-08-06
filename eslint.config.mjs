import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Reading localStorage/sessionStorage inside useEffect is required in Next.js
      // to avoid SSR crashes — these APIs don't exist on the server.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
]);

export default eslintConfig;
