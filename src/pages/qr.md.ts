import type { APIRoute } from 'astro';

import { SITE_NAME, abs, markdownResponse } from '@/lib/content';

export const GET: APIRoute = () =>
  markdownResponse(`# ${SITE_NAME}\n\nScan the QR code on ${abs('/qr')} to open ${abs('/')}.\n`);
