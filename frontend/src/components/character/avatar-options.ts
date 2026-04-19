import type { AvatarData } from '../../types';

export const SKIN_COLORS: { id: string; hex: string }[] = [
  { id: 'f8d5c2', hex: '#f8d5c2' },
  { id: 'edc8a0', hex: '#edc8a0' },
  { id: 'd9b28a', hex: '#d9b28a' },
  { id: 'c59374', hex: '#c59374' },
  { id: '9b6b45', hex: '#9b6b45' },
  { id: '7a4f30', hex: '#7a4f30' },
  { id: '8b6a3e', hex: '#8b6a3e' },
  { id: '4f3522', hex: '#4f3522' },
  { id: '2c1a0e', hex: '#2c1a0e' },
];

export const HAIR_COLORS: { id: string; hex: string }[] = [
  { id: '922610', hex: '#922610' },
  { id: '090806', hex: '#090806' },
  { id: 'f5d15e', hex: '#f5d15e' },
  { id: 'ca9849', hex: '#ca9849' },
  { id: '4e2b16', hex: '#4e2b16' },
  { id: '2c1a0e', hex: '#2c1a0e' },
  { id: 'f4a7b9', hex: '#f4a7b9' },
  { id: 'e5e5e5', hex: '#e5e5e5' },
  { id: 'a62116', hex: '#a62116' },
  { id: 'a0a0a0', hex: '#a0a0a0' },
];

// short01–short24 + long01–long21 = 45 estilos válidos no DiceBear pixel-art
export const HAIR_STYLES: string[] = [
  ...Array.from({ length: 24 }, (_, i) => `short${String(i + 1).padStart(2, '0')}`),
  ...Array.from({ length: 21 }, (_, i) => `long${String(i + 1).padStart(2, '0')}`),
];

// DiceBear pixel-art tem variant01–variant12 para olhos
export const EYE_VARIANTS: string[] = Array.from(
  { length: 12 },
  (_, i) => `variant${String(i + 1).padStart(2, '0')}`,
);

// DiceBear pixel-art tem happy01–happy13 e sad01–sad10
export const MOUTH_VARIANTS: string[] = [
  ...Array.from({ length: 13 }, (_, i) => `happy${String(i + 1).padStart(2, '0')}`),
  ...Array.from({ length: 10 }, (_, i) => `sad${String(i + 1).padStart(2, '0')}`),
];

// DiceBear pixel-art tem variant01–variant23 para roupas
export const CLOTHING_VARIANTS: string[] = Array.from(
  { length: 23 },
  (_, i) => `variant${String(i + 1).padStart(2, '0')}`,
);

export const CLOTHING_COLORS: { id: string; hex: string }[] = [
  { id: '252525', hex: '#252525' },
  { id: '65c9f0', hex: '#65c9f0' },
  { id: '5199e4', hex: '#5199e4' },
  { id: 'b2b2b2', hex: '#b2b2b2' },
  { id: '929598', hex: '#929598' },
  { id: '6d7c8d', hex: '#6d7c8d' },
  { id: 'b1e2ff', hex: '#b1e2ff' },
  { id: 'b1f4cf', hex: '#b1f4cf' },
  { id: 'ffd785', hex: '#ffd785' },
  { id: 'ffafb9', hex: '#ffafb9' },
  { id: 'ffffb1', hex: '#ffffb1' },
  { id: 'ff488e', hex: '#ff488e' },
  { id: 'ff5c5c', hex: '#ff5c5c' },
  { id: 'ffffff', hex: '#ffffff' },
];

// DiceBear pixel-art tem variant01–variant08 para barba
export const BEARD_VARIANTS: { id: string | null; label: string }[] = [
  { id: null, label: 'Sem barba' },
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `variant${String(i + 1).padStart(2, '0')}`,
    label: `Barba ${i + 1}`,
  })),
];

// DiceBear pixel-art tem variant01–variant04 para accessories
export const ACCESSORY_OPTIONS: { id: string; label: string }[] = [
  { id: 'variant01', label: 'Acessório 1' },
  { id: 'variant02', label: 'Acessório 2' },
  { id: 'variant03', label: 'Acessório 3' },
  { id: 'variant04', label: 'Acessório 4' },
];

// DiceBear pixel-art: light01–light07 (armações claras) e dark01–dark07 (escuras)
export const GLASSES_VARIANTS: string[] = [
  ...Array.from({ length: 7 }, (_, i) => `light${String(i + 1).padStart(2, '0')}`),
  ...Array.from({ length: 7 }, (_, i) => `dark${String(i + 1).padStart(2, '0')}`),
];

export const GLASSES_COLORS: { id: string; hex: string }[] = [
  { id: 'a0a0a0', hex: '#a0a0a0' },
  { id: 'ffd700', hex: '#ffd700' },
  { id: 'b87333', hex: '#b87333' },
  { id: '252525', hex: '#252525' },
  { id: 'f5f5f5', hex: '#f5f5f5' },
  { id: '5199e4', hex: '#5199e4' },
  { id: 'ff5c5c', hex: '#ff5c5c' },
  { id: 'ca9849', hex: '#ca9849' },
];

// DiceBear pixel-art tem variant01–variant10 para chapéus
export const HAT_VARIANTS: string[] = Array.from(
  { length: 10 },
  (_, i) => `variant${String(i + 1).padStart(2, '0')}`,
);

export const DEFAULT_AVATAR: AvatarData = {
  skinColor: 'd9b28a',
  hair: 'short01',
  hairColor: '4e2b16',
  eyes: 'variant01',
  mouth: 'happy01',
  beard: null,
  clothing: 'variant01',
  clothingColor: '65c9f0',
  accessories: [],
  backgroundColor: '1e293b',
  glasses: null,
  glassesColor: 'a0a0a0',
  hat: null,
  hatColor: '252525',
};
