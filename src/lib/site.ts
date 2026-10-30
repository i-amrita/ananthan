/**
 * Site-wide constants. Personal links are configurable without editing code:
 * set the `PUBLIC_*` variables in `.env` (see `.env.example`). Unset or empty values fall back to the placeholders below.
 * These are PUBLIC build-time values inlined into the client bundle, so never put secrets here.
 */
export const SITE_NAME = 'Ananthan Nambiar';

const env = import.meta.env;

/** Empty strings count as unset so a blank `.env` line keeps the fallback. */
const pick = (value: string | undefined, fallback: string) => value?.trim() || fallback;

export const EMAIL = pick(env.PUBLIC_EMAIL, 'nambiar4@uw.edu');

export const SOCIALS = {
  scholar: pick(env.PUBLIC_SCHOLAR_URL, 'https://scholar.google.com/citations?user=J6bXe4kAAAAJ'),
  orcid: pick(env.PUBLIC_ORCID_URL, 'https://orcid.org/0000-0002-9767-9456'),
  github: pick(env.PUBLIC_GITHUB_URL, 'https://github.com/annambiar'),
  instagram: pick(env.PUBLIC_INSTAGRAM_URL, 'https://instagram.com/filmi.nambi'),
  /** His photography portfolio. Copyright for every photo lives here. */
  portfolio: pick(env.PUBLIC_PORTFOLIO_URL, 'https://nambiar4.myportfolio.com'),
} as const;
