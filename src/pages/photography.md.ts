import type { APIRoute } from 'astro';

import { markdownResponse, photographyMarkdown } from '@/lib/content';

export const GET: APIRoute = async () => markdownResponse(await photographyMarkdown());
