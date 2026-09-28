const nextConfig = {
  reactStrictMode: false,
  serverExternalPackages: ["pdf-parse", "pdfjs-dist", "@napi-rs/canvas", "mammoth"],
  // PDF.js loads workers, fonts and native canvas bindings at runtime.
  // Include them explicitly in serverless/standalone document functions.
  outputFileTracingIncludes: {
    "/api/processes/*/document": [
      "./node_modules/pdf-parse/dist/worker/**/*",
      "./node_modules/pdfjs-dist/legacy/build/pdf.worker*.mjs",
      "./node_modules/pdfjs-dist/cmaps/**/*",
      "./node_modules/pdfjs-dist/standard_fonts/**/*",
      "./node_modules/pdfjs-dist/wasm/**/*",
      "./node_modules/@napi-rs/canvas/**/*",
      "./node_modules/@napi-rs/canvas-*/**/*",
    ],
  },
};

export default nextConfig;
