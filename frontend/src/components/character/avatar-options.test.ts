import {
  SKIN_COLORS,
  HAIR_COLORS,
  HAIR_STYLES,
  EYE_VARIANTS,
  EYEBROW_VARIANTS,
  MOUTH_VARIANTS,
  CLOTHING_VARIANTS,
  CLOTHING_COLORS,
  BEARD_VARIANTS,
  ACCESSORY_OPTIONS,
  DEFAULT_AVATAR,
} from './avatar-options';

describe('avatar-options', () => {
  it('SKIN_COLORS has 9 entries, each with id and hex', () => {
    expect(SKIN_COLORS).toHaveLength(9);
    SKIN_COLORS.forEach((c) => {
      expect(c.id).toBeTruthy();
      expect(c.hex).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  it('HAIR_COLORS has 10 entries, each with id and hex', () => {
    expect(HAIR_COLORS).toHaveLength(10);
    HAIR_COLORS.forEach((c) => {
      expect(c.id).toBeTruthy();
      expect(c.hex).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  it('HAIR_STYLES has 45 entries (19 short + 26 long)', () => {
    expect(HAIR_STYLES).toHaveLength(45);
    expect(HAIR_STYLES[0]).toBe('short01');
    expect(HAIR_STYLES[18]).toBe('short19');
    expect(HAIR_STYLES[19]).toBe('long01');
    expect(HAIR_STYLES[44]).toBe('long26');
  });

  it('EYE_VARIANTS has 26 entries', () => {
    expect(EYE_VARIANTS).toHaveLength(26);
    expect(EYE_VARIANTS[0]).toBe('variant01');
    expect(EYE_VARIANTS[25]).toBe('variant26');
  });

  it('EYEBROW_VARIANTS has 14 entries', () => {
    expect(EYEBROW_VARIANTS).toHaveLength(14);
  });

  it('MOUTH_VARIANTS is non-empty', () => {
    expect(MOUTH_VARIANTS.length).toBeGreaterThan(0);
  });

  it('CLOTHING_VARIANTS has 20 entries', () => {
    expect(CLOTHING_VARIANTS).toHaveLength(20);
  });

  it('CLOTHING_COLORS has 14 entries, each with id and hex', () => {
    expect(CLOTHING_COLORS).toHaveLength(14);
    CLOTHING_COLORS.forEach((c) => {
      expect(c.id).toBeTruthy();
      expect(c.hex).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  it('BEARD_VARIANTS first entry has null id (sem barba)', () => {
    expect(BEARD_VARIANTS[0].id).toBeNull();
    expect(BEARD_VARIANTS).toHaveLength(6);
  });

  it('ACCESSORY_OPTIONS has at least glasses and sunglasses', () => {
    const ids = ACCESSORY_OPTIONS.map((a) => a.id);
    expect(ids).toContain('glasses');
    expect(ids).toContain('sunglasses');
  });

  it('DEFAULT_AVATAR has all required AvatarData fields', () => {
    expect(DEFAULT_AVATAR).toMatchObject({
      skinColor: expect.any(String),
      hair: expect.any(String),
      hairColor: expect.any(String),
      eyes: expect.any(String),
      eyebrows: expect.any(String),
      mouth: expect.any(String),
      beard: null,
      clothing: expect.any(String),
      clothingColor: expect.any(String),
      accessories: [],
      backgroundColor: expect.any(String),
    });
  });
});
