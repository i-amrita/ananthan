import { abs, SITE_NAME, SITE_URL } from './content';
import { SOCIALS } from './site';

/** schema.org Person for Ananthan Nambiar. */
export function personJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: SITE_NAME,
    url: SITE_URL,
    email: `mailto:${SOCIALS.portfolio}`,
    affiliation: { '@type': 'CollegeOrUniversity', name: 'University of Washington' },
    jobTitle: 'Postdoctoral Scholar',
    knowsAbout: [
      'Machine learning',
      'Computational biology',
      'Protein language models',
      'Multi-omic data integration',
      'Photography',
    ],
    mainEntityOfPage: abs('/'),
    sameAs: [SOCIALS.scholar, SOCIALS.orcid, SOCIALS.github, SOCIALS.instagram],
  };
}
