import type { AvatarData } from '../../types';

export const SKIN_COLORS: { id: string; hex: string }[] = [
  { id: 'light', hex: '#f8d5c2' },
  { id: 'mellow', hex: '#edc8a0' },
  { id: 'warm', hex: '#d9b28a' },
  { id: 'honey', hex: '#c59374' },
  { id: 'brown', hex: '#9b6b45' },
  { id: 'darkBrown', hex: '#7a4f30' },
  { id: 'bronze', hex: '#8b6a3e' },
  { id: 'ebony', hex: '#4f3522' },
  { id: 'black', hex: '#2c1a0e' },
];

export const HAIR_COLORS: { id: string; hex: string }[] = [
  { id: 'auburn', hex: '#922610' },
  { id: 'black', hex: '#090806' },
  { id: 'blonde', hex: '#f5d15e' },
  { id: 'blondeGolden', hex: '#ca9849' },
  { id: 'brown', hex: '#4e2b16' },
  { id: 'brownDark', hex: '#2c1a0e' },
  { id: 'pastelPink', hex: '#f4a7b9' },
  { id: 'platinum', hex: '#e5e5e5' },
  { id: 'red', hex: '#a62116' },
  { id: 'silverGray', hex: '#a0a0a0' },
];

export const HAIR_STYLES: string[] = [
  ...Array.from({ length: 19 }, (_, i) => `short${String(i + 1).padStart(2, '0')}`),
  ...Array.from({ length: 26 }, (_, i) => `long${String(i + 1).padStart(2, '0')}`),
];

export const EYE_VARIANTS: string[] = Array.from(
  { length: 26 },
  (_, i) => `variant${String(i + 1).padStart(2, '0')}`,
);

export const EYEBROW_VARIANTS: string[] = Array.from(
  { length: 14 },
  (_, i) => `variant${String(i + 1).padStart(2, '0')}`,
);

export const MOUTH_VARIANTS: string[] = [
  'happy01', 'happy02', 'happy03', 'happy04', 'happy05', 'happy06',
  'sad01', 'sad02',
  'surprised01', 'surprised02',
];

export const CLOTHING_VARIANTS: string[] = Array.from(
  { length: 20 },
  (_, i) => `variant${String(i + 1).padStart(2, '0')}`,
);

export const CLOTHING_COLORS: { id: string; hex: string }[] = [
  { id: 'black', hex: '#252525' },
  { id: 'blue01', hex: '#65c9f0' },
  { id: 'blue02', hex: '#5199e4' },
  { id: 'gray01', hex: '#b2b2b2' },
  { id: 'gray02', hex: '#929598' },
  { id: 'heather', hex: '#6d7c8d' },
  { id: 'pastelBlue', hex: '#b1e2ff' },
  { id: 'pastelGreen', hex: '#b1f4cf' },
  { id: 'pastelOrange', hex: '#ffd785' },
  { id: 'pastelRed', hex: '#ffafb9' },
  { id: 'pastelYellow', hex: '#ffffb1' },
  { id: 'pink', hex: '#ff488e' },
  { id: 'red', hex: '#ff5c5c' },
  { id: 'white', hex: '#ffffff' },
];

export const BEARD_VARIANTS: { id: string | null; label: string }[] = [
  { id: null, label: 'Sem barba' },
  ...Array.from({ length: 5 }, (_, i) => ({
    id: `variant${String(i + 1).padStart(2, '0')}`,
    label: `Barba ${i + 1}`,
  })),
];

export const ACCESSORY_OPTIONS: { id: string; label: string }[] = [
  { id: 'glasses', label: 'Oculos' },
  { id: 'sunglasses', label: 'Oculos escuros' },
  { id: 'variant01', label: 'Acessorio 1' },
  { id: 'variant02', label: 'Acessorio 2' },
  { id: 'variant03', label: 'Acessorio 3' },
  { id: 'variant04', label: 'Acessorio 4' },
  { id: 'variant05', label: 'Acessorio 5' },
  { id: 'variant06', label: 'Acessorio 6' },
];

export const DEFAULT_AVATAR: AvatarData = {
  skinColor: 'warm',
  hair: 'short01',
  hairColor: 'brown',
  eyes: 'variant01',
  eyebrows: 'variant01',
  mouth: 'happy01',
  beard: null,
  clothing: 'variant01',
  clothingColor: 'blue01',
  accessories: [],
  backgroundColor: '1e293b',
};
