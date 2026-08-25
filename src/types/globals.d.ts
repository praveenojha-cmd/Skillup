// Ambient declaration for the optional process.env access in src/lib/supabase.ts.
// The app runs in the browser (esbuild output) and only reads this defensively
// behind a `typeof process !== 'undefined'` guard; no @types/node dependency needed.
declare var process: {
  env: Record<string, string | undefined>;
};
