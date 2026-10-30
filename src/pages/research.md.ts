import type { APIRoute } from 'astro';

import { markdownResponse, researchMarkdown } from '@/lib/content';

export const GET: APIRoute = async () => markdownResponse(await researchMarkdown());
