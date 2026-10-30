import { pngResponse, renderOg } from '@/lib/og';

export async function GET() {
  return pngResponse(
    await renderOg({
      title: 'Ananthan Nambiar',
      subtitle: 'Machine learning for computational biology',
      eyebrow: 'Portfolio',
    }),
  );
}
