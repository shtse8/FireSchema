import dts from 'bun-plugin-dts';

await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  plugins: [
    dts({
      // Optional: You can specify tsconfig path if it's not standard
      // configPath: './tsconfig.json',
      // Optional: Specify output options if needed
      // output: {
      //   noBanner: true,
      // }
    })
  ],
  // Keep consistent with tsconfig.json settings
  format: 'cjs', // Build as CommonJS again
  target: 'node', // Assuming compatibility with Node.js is desired
});

console.log('Build complete with types using bun-plugin-dts!');