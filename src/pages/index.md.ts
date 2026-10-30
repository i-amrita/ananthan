import type { APIRoute } from 'astro';

import { homeMarkdown, markdownResponse } from '@/lib/content';

export const GET: APIRoute = async () => markdownResponse(await homeMarkdown());
