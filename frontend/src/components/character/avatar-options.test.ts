import {
  SKIN_COLORS,
  HAIR_COLORS,
  HAIR_STYLES,
  EYE_VARIANTS,
  MOUTH_VARIANTS,
  CLOTHING_VARIANTS,
  CLOTHING_COLORS,
  BEARD_VARIANTS,
  ACCESSORY_OPTIONS,
  GLASSES_VARIANTS,
  GLASSES_COLORS,
  HAT_VARIANTS,
  DEFAULT_AVATAR,
} from './avatar-options';

describe('avatar-options', () => {
  it('SKIN_COLORS has 9 entries, each with id and hex', () => {
    expect(SKIN_COLORS).toHaveLength(9);
    SKIN_COLORS.forEach((c) => {
      expect(c.id).toMatch(/^[0-9a-f]{6}$/i);
      expect(c.hex).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  it('HAIR_COLORS has 10 entries, each with id and hex', () => {
    expect(HAIR_COLORS).toHaveLength(10);
    HAIR_COLORS.forEach((c) => {
      expect(c.id).toMatch(/^[0-9a-f]{6}$/i);
      expect(c.hex).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  it('HAIR_STYLES has 45 entries (24 short + 21 long), all valid DiceBear names', () => {
    expect(HAIR_STYLES).toHaveLength(45);
    expect(HAIR_STYLES[0]).toBe('short01');
    expect(HAIR_STYLES[23]).toBe('short24');
    expect(HAIR_STYLES[24]).toBe('long01');
    expect(HAIR_STYLES[44]).toBe('long21');
  });

  it('EYE_VARIANTS has exactly 12 entries matching DiceBear pixel-art', () => {
    expect(EYE_VARIANTS).toHaveLength(12);
    expect(EYE_VARIANTS[0]).toBe('variant01');
    expect(EYE_VARIANTS[11]).toBe('variant12');
  });

  it('MOUTH_VARIANTS has 23 entries (13 happy + 10 sad), all valid', () => {
    expect(MOUTH_VARIANTS).toHaveLength(23);
    expect(MOUTH_VARIANTS[0]).toBe('happy01');
    expect(MOUTH_VARIANTS[12]).toBe('happy13');
    expect(MOUTH_VARIANTS[13]).toBe('sad01');
    expect(MOUTH_VARIANTS[22]).toBe('sad10');
  });

  it('CLOTHING_VARIANTS has 23 entries', () => {
    expect(CLOTHING_VARIANTS).toHaveLength(23);
  });

  it('CLOTHING_COLORS has 14 entries, each with id and hex', () => {
    expect(CLOTHING_COLORS).toHaveLength(14);
    CLOTHING_COLORS.forEach((c) => {
      expect(c.id).toMatch(/^[0-9a-f]{6}$/i);
      expect(c.hex).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  it('BEARD_VARIANTS has 9 entries (null + variant01–08), first is null', () => {
    expect(BEARD_VARIANTS).toHaveLength(9);
    expect(BEARD_VARIANTS[0].id).toBeNull();
    expect(BEARD_VARIANTS[8].id).toBe('variant08');
  });

  it('ACCESSORY_OPTIONS has exactly 4 valid DiceBear entries', () => {
    expect(ACCESSORY_OPTIONS).toHaveLength(4);
    const ids = ACCESSORY_OPTIONS.map((a) => a.id);
    expect(ids).toEqual(['variant01', 'variant02', 'variant03', 'variant04']);
  });

  it('GLASSES_VARIANTS has 14 entries (light01–07 + dark01–07)', () => {
    expect(GLASSES_VARIANTS).toHaveLength(14);
    expect(GLASSES_VARIANTS[0]).toBe('light01');
    expect(GLASSES_VARIANTS[6]).toBe('light07');
    expect(GLASSES_VARIANTS[7]).toBe('dark01');
    expect(GLASSES_VARIANTS[13]).toBe('dark07');
  });

  it('GLASSES_COLORS has 8 entries, each with id and hex', () => {
    expect(GLASSES_COLORS).toHaveLength(8);
    GLASSES_COLORS.forEach((c) => {
      expect(c.id).toMatch(/^[0-9a-f]{6}$/i);
      expect(c.hex).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  it('HAT_VARIANTS has 10 entries (variant01–10)', () => {
    expect(HAT_VARIANTS).toHaveLength(10);
    expect(HAT_VARIANTS[0]).toBe('variant01');
    expect(HAT_VARIANTS[9]).toBe('variant10');
  });

  it('DEFAULT_AVATAR has all required AvatarData fields including glasses and hat', () => {
    expect(DEFAULT_AVATAR).toMatchObject({
      skinColor: expect.stringMatching(/^[0-9a-f]{6}$/i),
      hair: expect.any(String),
      hairColor: expect.stringMatching(/^[0-9a-f]{6}$/i),
      eyes: expect.any(String),
      mouth: expect.any(String),
      beard: null,
      clothing: expect.any(String),
      clothingColor: expect.stringMatching(/^[0-9a-f]{6}$/i),
      accessories: [],
      backgroundColor: expect.stringMatching(/^[0-9a-f]{6}$/i),
      glasses: null,
      glassesColor: expect.stringMatching(/^[0-9a-f]{6}$/i),
      hat: null,
      hatColor: expect.stringMatching(/^[0-9a-f]{6}$/i),
    });
  });
});
