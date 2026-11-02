/**
 * Build-time projection of the hero drawer content, from the same collections the pages use,
 * so the drawer and the page cannot drift — only the projection differs (drawer vs page).
 */
import type { OverlayData } from '@/components/react/FocusOverlays';
import { m } from '@/lib/i18n';
import { getPhotoTeasers, getResearchTeasers } from '@/lib/panels';

const HOBBIES = [
  {
    key: 'life_photography',
    title: () => m.life_photography(),
    body: () => m.life_photography_body(),
  },
  { key: 'life_dance', title: () => m.life_dance(), body: () => m.life_dance_body() },
  { key: 'life_rowing', title: () => m.life_rowing(), body: () => m.life_rowing_body() },
  { key: 'life_cooking', title: () => m.life_cooking(), body: () => m.life_cooking_body() },
  {
    key: 'life_environment',
    title: () => m.life_environment(),
    body: () => m.life_environment_body(),
  },
] as const;

/** Drawer content for the research, photography and life panels. */
export async function getOverlayData(): Promise<OverlayData> {
  const [research, photos] = await Promise.all([getResearchTeasers(), getPhotoTeasers()]);
  return {
    research,
    photography: {
      photos,
      // The owner's Instagram, the URL the owner supplied in the steer.
      instagram: 'https://www.instagram.com/filmi.nambi',
    },
    life: {
      hobbies: HOBBIES.map((h) => ({ key: h.key, title: h.title(), body: h.body() })),
      bio: m.life_bio(),
      career: m.life_career(),
    },
  };
}
