import * as pdfjs from 'pdfjs-dist';

// ✅ Static path in public folder — works in Vite dev + build, no hashing issues
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

export { pdfjs };