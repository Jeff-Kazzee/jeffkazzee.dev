import type { ImageMetadata } from 'astro';
import pillarsMiri from '../assets/space/pillars-miri.jpg';
import arp142 from '../assets/space/arp142.jpg';
import pillarsNircam from '../assets/space/pillars-nircam.jpg';
import stephansQuintet from '../assets/space/stephans-quintet.jpg';
import rhoOphiuchi from '../assets/space/rho-ophiuchi.jpg';
import { spaceImageId } from './space-selection.mjs';

export type HeroOptions = { title: string; description?: string; align?: 'left' | 'right' };
export type SpaceImage = { id: string; src: ImageMetadata; title: string; alt: string; credit: string; source: string; position: string; mobilePosition?: string };
export const SPACE_IMAGES: Record<string, SpaceImage> = {
  'pillars-miri': { id: 'pillars-miri', src: pillarsMiri, title: 'Pillars of Creation, MIRI', alt: 'Red and gray dust pillars against a field of stars, observed by the James Webb Space Telescope in mid-infrared light.', credit: 'NASA, ESA, CSA, STScI, J. DePasquale (STScI), A. Pagan (STScI)', source: 'https://esawebb.org/images/weic2218a/', position: '50% 54%', mobilePosition: '62% 50%' },
  arp142: { id: 'arp142', src: arp142, title: 'Arp 142', alt: 'The interacting Penguin and Egg galaxies, photographed by the James Webb Space Telescope.', credit: 'NASA, ESA, CSA, STScI', source: 'https://esawebb.org/images/weic2420a/', position: '50% 40%', mobilePosition: '37% 40%' },
  'pillars-nircam': { id: 'pillars-nircam', src: pillarsNircam, title: 'Pillars of Creation, NIRCam', alt: 'Golden dust pillars and young stars in the Eagle Nebula, observed by the James Webb Space Telescope.', credit: 'NASA, ESA, CSA, STScI; J. DePasquale, A. Koekemoer, A. Pagan (STScI).', source: 'https://esawebb.org/images/weic2216a/', position: '58% 45%' },
  'stephans-quintet': { id: 'stephans-quintet', src: stephansQuintet, title: 'Stephan’s Quintet', alt: 'A compact group of galaxies with sweeping tails and bright cores, photographed by the James Webb Space Telescope.', credit: 'NASA, ESA, CSA, and STScI', source: 'https://esawebb.org/images/weic2208a/', position: '58% 45%' },
  'rho-ophiuchi': { id: 'rho-ophiuchi', src: rhoOphiuchi, title: 'Rho Ophiuchi', alt: 'A nearby star-forming region with illuminated dust and red outflows, photographed by the James Webb Space Telescope.', credit: 'NASA, ESA, CSA, STScI, K. Pontoppidan (STScI), A. Pagan (STScI)', source: 'https://esawebb.org/images/weic2316a/', position: '58% 50%' },
};
export function spaceImageForPath(pathname: string): SpaceImage { return SPACE_IMAGES[spaceImageId(pathname)]; }
