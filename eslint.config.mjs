import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "venv/**",
  ]),
  {
    rules: {
      // Reading localStorage/sessionStorage inside useEffect is required in Next.js
      // to avoid SSR crashes — these APIs don't exist on the server.
      'react-hooks/set-state-in-effect': 'off',
      // Flags useCallback closures that reference refs, even though ref.current
      // is only accessed when the callback executes (onClick), never during render.
      'react-hooks/refs': 'off',
    },
  },
]);

export default eslintConfig;
