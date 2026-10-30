import type { APIRoute } from 'astro';

import { lifeMarkdown, markdownResponse } from '@/lib/content';

export const GET: APIRoute = async () => markdownResponse(await lifeMarkdown());
