import { backend } from './index.js';
const b = backend();
console.log(`[blob] backend=${b}`);
if (b === 'fs') { const { mkdirSync } = await import('node:fs'); mkdirSync(process.env.BLOB_FS_ROOT ?? './.blob', { recursive: true }); console.log('[blob] fs root ready'); }
if (b === 'gridfs') console.log('[blob] gridfs bucket "media" is created lazily on first put (inside the Sandbox: eligibility-safe)');
if (b === 'r2') console.log(`[blob] ensure R2 bucket ${process.env.R2_BUCKET ?? '3pt-media'} (wrangler r2 bucket create)`);
