import { join } from 'node:path';
/** Where a capture run writes: captures/<CAPTURE_RUN or "latest">. */
export const RUN = process.env.CAPTURE_RUN ?? 'latest';
export const OUT = join(import.meta.dirname, '..', 'captures', RUN);
