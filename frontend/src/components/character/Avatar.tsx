import { useMemo } from 'react';
import { createAvatar } from '@dicebear/core';
import { create, meta, schema } from '@dicebear/pixel-art';
import type { AvatarData } from '../../types';
import { cn } from '../../lib/utils';

interface AvatarProps {
  data: AvatarData;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = { sm: 40, md: 80, lg: 120 };

const pixelArtStyle = { meta, schema, create };

export const Avatar: React.FC<AvatarProps> = ({ data, size = 'md', className }) => {
  const svg = useMemo(
    () => {
      // DiceBear v9 expects strict union types per option (e.g. "short01" | "short02"),
      // but AvatarData uses string for portability. Cast is safe — values come from avatar-options constants.
      // Color options (skinColor, hairColor, etc.) expect hex without '#'; convertColor() adds '#' internally.
      return createAvatar(pixelArtStyle, {
        skinColor: [data.skinColor],
        hair: [data.hair],
        hairColor: [data.hairColor],
        eyes: [data.eyes],
        mouth: [data.mouth],
        beard: data.beard ? [data.beard] : [],
        beardProbability: data.beard ? 100 : 0,
        clothing: [data.clothing],
        clothingColor: [data.clothingColor],
        accessories: data.accessories.length ? data.accessories : [],
        accessoriesProbability: data.accessories.length ? 100 : 0,
        backgroundColor: [data.backgroundColor],
        glasses: data.glasses ? [data.glasses] : [],
        glassesProbability: data.glasses ? 100 : 0,
        glassesColor: [data.glassesColor],
        hat: data.hat ? [data.hat] : [],
        hatProbability: data.hat ? 100 : 0,
        hatColor: [data.hatColor],
      } as any).toString();
    },
    [data],
  );

  const px = sizes[size];
  return (
    <div
      className={cn('inline-block', className)}
      style={{ width: px, height: px }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

export default Avatar;
