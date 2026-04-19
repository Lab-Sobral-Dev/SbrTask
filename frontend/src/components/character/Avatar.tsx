import { useMemo } from 'react';
import { createAvatar } from '@dicebear/core';
import { pixelArt } from '@dicebear/pixel-art';
import type { AvatarData } from '../../types';
import { cn } from '../../lib/utils';

interface AvatarProps {
  data: AvatarData;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = { sm: 40, md: 80, lg: 120 };

export const Avatar: React.FC<AvatarProps> = ({ data, size = 'md', className }) => {
  const svg = useMemo(() => {
    try {
      const avatar = createAvatar(pixelArt, {
        skinColor: [data.skinColor],
        hair: [data.hair],
        hairColor: [data.hairColor],
        eyes: [data.eyes],
        mouth: [data.mouth],
        clothing: [data.clothing],
        clothingColor: [data.clothingColor],
        beard: data.beard ? [data.beard] : undefined,
        beardProbability: data.beard ? 100 : 0,
        accessories: data.accessories && data.accessories.length ? data.accessories : undefined,
        accessoriesProbability: data.accessories && data.accessories.length ? 100 : 0,
      });
      return avatar.toString();
    } catch (error) {
      console.error('Error generating avatar:', error);
      return '<svg></svg>';
    }
  }, [data]);

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
