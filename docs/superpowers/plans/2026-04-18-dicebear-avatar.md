# DiceBear Avatar Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o sistema de avatar SVG handcrafted pelo DiceBear pixel-art (npm local), mantendo o editor de customização com preview em tempo real via mini-avatares.

**Architecture:** Instalar `@dicebear/core` + `@dicebear/pixel-art`, criar `avatar-options.ts` com todas as constantes DiceBear, reescrever `Avatar.tsx` como wrapper fino, e reescrever `CharacterEditor.tsx` com `MiniAvatar` para preview de variantes. O tipo `AvatarData` é migrado para os parâmetros nativos do DiceBear e o `@default` do Prisma é atualizado.

**Tech Stack:** React 19, `@dicebear/core`, `@dicebear/pixel-art`, Vitest + jsdom + @testing-library/react (globals: true), Tailwind CSS 3.4, Prisma 6.

---

## File Map

| Ação | Arquivo | Responsabilidade |
|------|---------|-----------------|
| Criar | `frontend/src/components/character/avatar-options.ts` | Constantes DiceBear: cores, estilos, variantes, DEFAULT_AVATAR |
| Modificar | `frontend/src/types/index.ts` | Novo tipo `AvatarData` com params nativos DiceBear |
| Reescrever | `frontend/src/components/character/Avatar.tsx` | Wrapper fino sobre `createAvatar` (~35 linhas) |
| Reescrever | `frontend/src/components/character/CharacterEditor.tsx` | Editor com 5 abas, `MiniAvatar`, `VariantPicker` |
| Modificar | `frontend/src/pages/Register.tsx` | Fix import `AvatarData` (veio de Avatar.tsx, vai para types) |
| Verificar | `frontend/src/hooks/useAuthStore.ts` | Tipo `AvatarData` muda — apenas verificar, sem mudança de lógica |
| Modificar | `backend/prisma/schema.prisma` | Atualizar `@default` do campo `avatar` |

---

### Task 1: Instalar pacotes DiceBear

**Files:**
- Modify: `frontend/package.json` (via npm install)

- [ ] **Step 1: Instalar no diretório frontend**

```bash
cd frontend
npm install @dicebear/core @dicebear/pixel-art
```

Expected output: `added N packages` sem erros.

- [ ] **Step 2: Verificar que os pacotes foram instalados**

```bash
node -e "const {createAvatar}=require('@dicebear/core'); const {pixelArt}=require('@dicebear/pixel-art'); const a=createAvatar(pixelArt,{}); console.log(a.toString().slice(0,30))"
```

Expected: começa com `<svg ` (SVG gerado com sucesso).

- [ ] **Step 3: Commit**

```bash
git add frontend/package.json frontend/package-lock.json
git commit -m "chore(frontend): install @dicebear/core and @dicebear/pixel-art"
```

---

### Task 2: Escrever teste falho para avatar-options.ts

**Files:**
- Create: `frontend/src/components/character/avatar-options.test.ts`

- [ ] **Step 1: Criar o arquivo de teste**

Crie `frontend/src/components/character/avatar-options.test.ts`:

```ts
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
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

```bash
cd frontend && npx vitest run src/components/character/avatar-options.test.ts
```

Expected: FAIL — `Cannot find module './avatar-options'`

---

### Task 3: Criar avatar-options.ts (fazer o teste passar)

**Files:**
- Create: `frontend/src/components/character/avatar-options.ts`

- [ ] **Step 1: Criar o arquivo com todas as constantes**

Crie `frontend/src/components/character/avatar-options.ts`:

```ts
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
```

- [ ] **Step 2: Rodar o teste e confirmar que passa**

```bash
cd frontend && npx vitest run src/components/character/avatar-options.test.ts
```

Expected: PASS — todos os testes verdes. Se algum falhar, ajuste a constante correspondente.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/character/avatar-options.ts frontend/src/components/character/avatar-options.test.ts
git commit -m "feat(avatar): add avatar-options constants for DiceBear pixel-art"
```

---

### Task 4: Atualizar tipo AvatarData em types/index.ts

**Files:**
- Modify: `frontend/src/types/index.ts:13-24`

- [ ] **Step 1: Substituir o bloco AvatarData**

Em `frontend/src/types/index.ts`, substitua:

```ts
export interface AvatarData {
  skinTone: string;
  hairStyle: string;
  hairColor: string;
  facialHair: string;
  eyes: {
    color: string;
    shape: string;
  };
  outfit: string;
  accessories: string[];
}
```

Por:

```ts
export interface AvatarData {
  skinColor: string;
  hair: string;
  hairColor: string;
  eyes: string;
  eyebrows: string;
  mouth: string;
  beard: string | null;
  clothing: string;
  clothingColor: string;
  accessories: string[];
  backgroundColor: string;
}
```

- [ ] **Step 2: Verificar que o TypeScript não aponta erros em types/index.ts**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -30
```

Haverá erros nos arquivos que usam o tipo antigo — é esperado. Serão resolvidos nas tasks seguintes.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/types/index.ts
git commit -m "feat(avatar): migrate AvatarData type to DiceBear pixel-art params"
```

---

### Task 5: Escrever teste falho para Avatar.tsx

**Files:**
- Create: `frontend/src/components/character/Avatar.test.tsx`

- [ ] **Step 1: Criar o arquivo de teste**

Crie `frontend/src/components/character/Avatar.test.tsx`:

```tsx
import { render } from '@testing-library/react';
import { Avatar } from './Avatar';
import { DEFAULT_AVATAR } from './avatar-options';

describe('Avatar', () => {
  it('renders an svg for valid avatar data', () => {
    const { container } = render(<Avatar data={DEFAULT_AVATAR} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('applies sm size (40px)', () => {
    const { container } = render(<Avatar data={DEFAULT_AVATAR} size="sm" />);
    const div = container.firstChild as HTMLElement;
    expect(div.style.width).toBe('40px');
    expect(div.style.height).toBe('40px');
  });

  it('applies md size (80px) by default', () => {
    const { container } = render(<Avatar data={DEFAULT_AVATAR} />);
    const div = container.firstChild as HTMLElement;
    expect(div.style.width).toBe('80px');
  });

  it('applies lg size (120px)', () => {
    const { container } = render(<Avatar data={DEFAULT_AVATAR} size="lg" />);
    const div = container.firstChild as HTMLElement;
    expect(div.style.width).toBe('120px');
  });

  it('passes className to wrapper div', () => {
    const { container } = render(<Avatar data={DEFAULT_AVATAR} className="my-class" />);
    expect((container.firstChild as HTMLElement).classList.contains('my-class')).toBe(true);
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

```bash
cd frontend && npx vitest run src/components/character/Avatar.test.tsx
```

Expected: FAIL — o Avatar atual ainda usa o sistema SVG antigo e o `AvatarData` antigo, causando erros de tipo.

---

### Task 6: Reescrever Avatar.tsx com DiceBear (fazer o teste passar)

**Files:**
- Rewrite: `frontend/src/components/character/Avatar.tsx`

- [ ] **Step 1: Substituir o conteúdo completo do arquivo**

Substitua todo o conteúdo de `frontend/src/components/character/Avatar.tsx` por:

```tsx
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
  const svg = useMemo(
    () =>
      createAvatar(pixelArt, {
        skinColor: [data.skinColor],
        hair: [data.hair],
        hairColor: [data.hairColor],
        eyes: [data.eyes],
        eyebrows: [data.eyebrows],
        mouth: [data.mouth],
        beard: data.beard ? [data.beard] : [],
        beardProbability: data.beard ? 100 : 0,
        clothing: [data.clothing],
        clothingColor: [data.clothingColor],
        accessories: data.accessories.length ? data.accessories : [],
        accessoriesProbability: data.accessories.length ? 100 : 0,
        backgroundColor: [data.backgroundColor],
      }).toString(),
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
```

- [ ] **Step 2: Rodar o teste e confirmar que passa**

```bash
cd frontend && npx vitest run src/components/character/Avatar.test.tsx
```

Expected: PASS — 5 testes verdes.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/character/Avatar.tsx frontend/src/components/character/Avatar.test.tsx
git commit -m "feat(avatar): rewrite Avatar.tsx using DiceBear pixel-art"
```

---

### Task 7: Atualizar @default no schema Prisma

**Files:**
- Modify: `backend/prisma/schema.prisma:19`

- [ ] **Step 1: Localizar a linha do campo avatar**

Abra `backend/prisma/schema.prisma` e encontre a linha:

```prisma
avatar    Json?    @default("{\"skinTone\":\"#F5D0B5\",\"hairStyle\":\"hair-1\",\"hairColor\":\"#4A3728\",\"eyes\":{\"color\":\"#4B7B4B\",\"shape\":\"round\"},\"outfit\":\"outfit-1\",\"accessories\":[]}")
```

- [ ] **Step 2: Substituir pelo novo default**

```prisma
avatar    Json?    @default("{\"skinColor\":\"warm\",\"hair\":\"short01\",\"hairColor\":\"brown\",\"eyes\":\"variant01\",\"eyebrows\":\"variant01\",\"mouth\":\"happy01\",\"beard\":null,\"clothing\":\"variant01\",\"clothingColor\":\"blue01\",\"accessories\":[],\"backgroundColor\":\"1e293b\"}")
```

Não é necessário rodar `prisma migrate` — o campo é `Json?` e o `@default` é aplicado apenas em novos registros. Usuários existentes manterão seus dados até abrirem o editor.

- [ ] **Step 3: Commit**

```bash
git add backend/prisma/schema.prisma
git commit -m "feat(avatar): update Prisma avatar @default to DiceBear params"
```

---

### Task 8: Escrever teste falho para CharacterEditor.tsx

**Files:**
- Create: `frontend/src/components/character/CharacterEditor.test.tsx`

- [ ] **Step 1: Criar o arquivo de teste**

Crie `frontend/src/components/character/CharacterEditor.test.tsx`:

```tsx
import { render, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import CharacterEditor from './CharacterEditor';
import { DEFAULT_AVATAR } from './avatar-options';

describe('CharacterEditor', () => {
  it('calls onComplete with DEFAULT_AVATAR when confirmed without changes', () => {
    const onComplete = vi.fn();
    const { getByText } = render(<CharacterEditor onComplete={onComplete} />);
    fireEvent.click(getByText('Confirmar personagem'));
    expect(onComplete).toHaveBeenCalledWith(DEFAULT_AVATAR);
  });

  it('calls onComplete with initialData when provided and user confirms', () => {
    const onComplete = vi.fn();
    const initial = { ...DEFAULT_AVATAR, skinColor: 'ebony' };
    const { getByText } = render(<CharacterEditor initialData={initial} onComplete={onComplete} />);
    fireEvent.click(getByText('Confirmar personagem'));
    expect(onComplete).toHaveBeenCalledWith(initial);
  });

  it('renders all 5 tabs', () => {
    const { getByText } = render(<CharacterEditor onComplete={vi.fn()} />);
    expect(getByText('Pele')).toBeTruthy();
    expect(getByText('Cabelo')).toBeTruthy();
    expect(getByText('Rosto')).toBeTruthy();
    expect(getByText('Roupa')).toBeTruthy();
    expect(getByText('Extras')).toBeTruthy();
  });

  it('switches to Cabelo tab on click', () => {
    const { getByText } = render(<CharacterEditor onComplete={vi.fn()} />);
    fireEvent.click(getByText('Cabelo'));
    expect(getByText('Cor do cabelo')).toBeTruthy();
  });

  it('switches to Extras tab and shows Sem barba option', () => {
    const { getByText } = render(<CharacterEditor onComplete={vi.fn()} />);
    fireEvent.click(getByText('Extras'));
    expect(getByText('Sem barba')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

```bash
cd frontend && npx vitest run src/components/character/CharacterEditor.test.tsx
```

Expected: FAIL — o editor atual usa o tipo `AvatarData` antigo.

---

### Task 9: Reescrever CharacterEditor.tsx (fazer o teste passar)

**Files:**
- Rewrite: `frontend/src/components/character/CharacterEditor.tsx`

- [ ] **Step 1: Substituir o conteúdo completo do arquivo**

Substitua todo o conteúdo de `frontend/src/components/character/CharacterEditor.tsx` por:

```tsx
import { useState, useMemo } from 'react';
import { Check } from 'lucide-react';
import { createAvatar } from '@dicebear/core';
import { pixelArt } from '@dicebear/pixel-art';
import { Avatar } from './Avatar';
import type { AvatarData } from '../../types';
import { cn } from '../../lib/utils';
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

interface CharacterEditorProps {
  initialData?: AvatarData;
  onComplete: (avatar: AvatarData) => void;
}

const buildOptions = (data: AvatarData) => ({
  skinColor: [data.skinColor],
  hair: [data.hair],
  hairColor: [data.hairColor],
  eyes: [data.eyes],
  eyebrows: [data.eyebrows],
  mouth: [data.mouth],
  beard: data.beard ? [data.beard] : [],
  beardProbability: data.beard ? 100 : 0,
  clothing: [data.clothing],
  clothingColor: [data.clothingColor],
  accessories: data.accessories.length ? data.accessories : [],
  accessoriesProbability: data.accessories.length ? 100 : 0,
  backgroundColor: [data.backgroundColor],
});

const MiniAvatar = ({
  base,
  overrides,
  isSelected,
  onSelect,
  label,
}: {
  base: AvatarData;
  overrides: Record<string, unknown>;
  isSelected: boolean;
  onSelect: () => void;
  label?: string;
}) => {
  const svg = useMemo(
    () => createAvatar(pixelArt, { ...buildOptions(base), ...overrides }).toString(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify({ ...buildOptions(base), ...overrides })],
  );

  return (
    <button
      onClick={onSelect}
      title={label}
      className={cn(
        'rounded border-2 p-0.5 transition-colors hover:border-[color:var(--tf-primary)]',
        isSelected
          ? 'border-[color:var(--tf-primary)] shadow-[0_0_0_2px_rgba(217,164,65,0.25)]'
          : 'border-[color:var(--tf-border-soft)]',
      )}
    >
      <div dangerouslySetInnerHTML={{ __html: svg }} style={{ width: 48, height: 48 }} />
    </button>
  );
};

const CharacterEditor: React.FC<CharacterEditorProps> = ({ initialData, onComplete }) => {
  const [avatar, setAvatar] = useState<AvatarData>(initialData ?? DEFAULT_AVATAR);
  const [activeTab, setActiveTab] = useState<'skin' | 'hair' | 'rosto' | 'roupa' | 'extras'>('skin');

  const tabs = [
    { id: 'skin', label: 'Pele' },
    { id: 'hair', label: 'Cabelo' },
    { id: 'rosto', label: 'Rosto' },
    { id: 'roupa', label: 'Roupa' },
    { id: 'extras', label: 'Extras' },
  ] as const;

  const update = (patch: Partial<AvatarData>) => setAvatar((prev) => ({ ...prev, ...patch }));

  const toggleAccessory = (id: string) => {
    update({
      accessories: avatar.accessories.includes(id)
        ? avatar.accessories.filter((a) => a !== id)
        : [...avatar.accessories, id],
    });
  };

  const choiceClass = (selected: boolean) =>
    `tf-btn ${selected ? 'tf-btn-primary' : 'tf-btn-secondary'} !px-4 !py-2 !text-sm`;

  const swatchClass = (selected: boolean) =>
    `h-10 w-10 rounded-[4px] border-2 transition-transform hover:-translate-y-0.5 ${
      selected
        ? 'border-[color:var(--tf-primary)] shadow-[0_0_0_2px_rgba(217,164,65,0.25)]'
        : 'border-[color:var(--tf-border-soft)]'
    }`;

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <div className="tf-panel p-5">
        <p className="tf-title text-xs uppercase tracking-[0.16em] text-[color:var(--tf-primary)]">Retrato</p>
        <div className="mt-4 flex flex-col items-center">
          <div className="tf-frame relative w-full max-w-[220px] p-3">
            <div className="tf-panel-inset flex h-[220px] items-center justify-center p-4">
              <Avatar data={avatar} size="lg" className="drop-shadow-[0_6px_0_rgba(10,15,20,0.85)]" />
            </div>
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
              <div className="tf-btn tf-btn-primary !cursor-default !px-4 !py-1.5 !text-sm">Nivel 1</div>
            </div>
          </div>
          <p className="mt-8 text-center text-sm text-[color:var(--tf-text-muted)]">
            Misture estilos, roupas e extras para criar personagens bem mais distintos.
          </p>
        </div>
      </div>

      <div className="tf-panel p-5">
        <div className="mb-5 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={choiceClass(activeTab === tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="tf-panel-inset min-h-[320px] p-4">
          {activeTab === 'skin' && (
            <div>
              <h3 className="tf-title text-lg text-[color:var(--tf-text-main)]">Tom de pele</h3>
              <div className="mt-5 flex flex-wrap gap-3">
                {SKIN_COLORS.map(({ id, hex }) => (
                  <button
                    key={id}
                    onClick={() => update({ skinColor: id })}
                    className={swatchClass(avatar.skinColor === id)}
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'hair' && (
            <div className="space-y-6">
              <div>
                <h3 className="tf-title text-lg text-[color:var(--tf-text-main)]">Estilo do cabelo</h3>
                <div className="mt-4 flex max-h-[200px] flex-wrap gap-2 overflow-y-auto">
                  {HAIR_STYLES.map((style) => (
                    <MiniAvatar
                      key={style}
                      base={avatar}
                      overrides={{ hair: [style] }}
                      isSelected={avatar.hair === style}
                      onSelect={() => update({ hair: style })}
                      label={style}
                    />
                  ))}
                </div>
              </div>
              <div>
                <h3 className="tf-title text-lg text-[color:var(--tf-text-main)]">Cor do cabelo</h3>
                <div className="mt-4 flex flex-wrap gap-3">
                  {HAIR_COLORS.map(({ id, hex }) => (
                    <button
                      key={id}
                      onClick={() => update({ hairColor: id })}
                      className={swatchClass(avatar.hairColor === id)}
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'rosto' && (
            <div className="space-y-6">
              <div>
                <h3 className="tf-title text-lg text-[color:var(--tf-text-main)]">Olhos</h3>
                <div className="mt-4 flex max-h-[160px] flex-wrap gap-2 overflow-y-auto">
                  {EYE_VARIANTS.map((v) => (
                    <MiniAvatar
                      key={v}
                      base={avatar}
                      overrides={{ eyes: [v] }}
                      isSelected={avatar.eyes === v}
                      onSelect={() => update({ eyes: v })}
                      label={v}
                    />
                  ))}
                </div>
              </div>
              <div>
                <h3 className="tf-title text-lg text-[color:var(--tf-text-main)]">Sobrancelhas</h3>
                <div className="mt-4 flex max-h-[120px] flex-wrap gap-2 overflow-y-auto">
                  {EYEBROW_VARIANTS.map((v) => (
                    <MiniAvatar
                      key={v}
                      base={avatar}
                      overrides={{ eyebrows: [v] }}
                      isSelected={avatar.eyebrows === v}
                      onSelect={() => update({ eyebrows: v })}
                      label={v}
                    />
                  ))}
                </div>
              </div>
              <div>
                <h3 className="tf-title text-lg text-[color:var(--tf-text-main)]">Boca</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {MOUTH_VARIANTS.map((v) => (
                    <MiniAvatar
                      key={v}
                      base={avatar}
                      overrides={{ mouth: [v] }}
                      isSelected={avatar.mouth === v}
                      onSelect={() => update({ mouth: v })}
                      label={v}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'roupa' && (
            <div className="space-y-6">
              <div>
                <h3 className="tf-title text-lg text-[color:var(--tf-text-main)]">Roupa</h3>
                <div className="mt-4 flex max-h-[200px] flex-wrap gap-2 overflow-y-auto">
                  {CLOTHING_VARIANTS.map((v) => (
                    <MiniAvatar
                      key={v}
                      base={avatar}
                      overrides={{ clothing: [v] }}
                      isSelected={avatar.clothing === v}
                      onSelect={() => update({ clothing: v })}
                      label={v}
                    />
                  ))}
                </div>
              </div>
              <div>
                <h3 className="tf-title text-lg text-[color:var(--tf-text-main)]">Cor da roupa</h3>
                <div className="mt-4 flex flex-wrap gap-3">
                  {CLOTHING_COLORS.map(({ id, hex }) => (
                    <button
                      key={id}
                      onClick={() => update({ clothingColor: id })}
                      className={swatchClass(avatar.clothingColor === id)}
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'extras' && (
            <div className="space-y-6">
              <div>
                <h3 className="tf-title text-lg text-[color:var(--tf-text-main)]">Barba</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {BEARD_VARIANTS.map(({ id, label }) =>
                    id === null ? (
                      <button
                        key="none"
                        onClick={() => update({ beard: null })}
                        className={choiceClass(avatar.beard === null)}
                      >
                        {label}
                      </button>
                    ) : (
                      <MiniAvatar
                        key={id}
                        base={avatar}
                        overrides={{ beard: [id], beardProbability: 100 }}
                        isSelected={avatar.beard === id}
                        onSelect={() => update({ beard: id })}
                        label={label}
                      />
                    ),
                  )}
                </div>
              </div>
              <div>
                <h3 className="tf-title text-lg text-[color:var(--tf-text-main)]">Acessorios</h3>
                <p className="mt-1 text-sm text-[color:var(--tf-text-muted)]">Voce pode combinar varios ao mesmo tempo.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {ACCESSORY_OPTIONS.map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => toggleAccessory(id)}
                      className={choiceClass(avatar.accessories.includes(id))}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={() => onComplete(avatar)} className="tf-btn tf-btn-primary">
            <Check size={18} />
            Confirmar personagem
          </button>
        </div>
      </div>
    </div>
  );
};

export default CharacterEditor;
```

- [ ] **Step 2: Rodar o teste e confirmar que passa**

```bash
cd frontend && npx vitest run src/components/character/CharacterEditor.test.tsx
```

Expected: PASS — 5 testes verdes.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/character/CharacterEditor.tsx frontend/src/components/character/CharacterEditor.test.tsx
git commit -m "feat(avatar): rewrite CharacterEditor with DiceBear pixel-art options"
```

---

### Task 10: Corrigir Register.tsx

**Files:**
- Modify: `frontend/src/pages/Register.tsx:7`

- [ ] **Step 1: Atualizar o import de AvatarData**

Em `frontend/src/pages/Register.tsx`, a linha 7 importa `AvatarData` de `'../components/character/Avatar'`. O novo `Avatar.tsx` não re-exporta mais `AvatarData`.

Substitua:

```ts
import { AvatarData } from '../components/character/Avatar';
```

Por:

```ts
import type { AvatarData } from '../types';
```

- [ ] **Step 2: Verificar que o TypeScript compila sem erros em Register.tsx**

```bash
cd frontend && npx tsc --noEmit 2>&1 | grep "Register"
```

Expected: nenhuma linha com "Register" nos erros.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Register.tsx
git commit -m "fix(avatar): update AvatarData import in Register.tsx to types"
```

---

### Task 11: Verificar useAuthStore.ts

**Files:**
- Verify: `frontend/src/hooks/useAuthStore.ts`

- [ ] **Step 1: Confirmar que o import de AvatarData está correto**

Abra `frontend/src/hooks/useAuthStore.ts`. O import deve ser:

```ts
import { User, AvatarData } from '../types';
```

Esse import já aponta para `../types` — nenhuma mudança necessária.

- [ ] **Step 2: Confirmar que updateAvatar ainda funciona com o novo tipo**

O método `updateAvatar` recebe `AvatarData` e faz `{ ...state.user, avatar }`. Como o tipo mudou mas a lógica é a mesma (substituição do objeto), nenhuma alteração de código é necessária.

- [ ] **Step 3: Verificar que não há erros de TS em useAuthStore.ts**

```bash
cd frontend && npx tsc --noEmit 2>&1 | grep "useAuthStore"
```

Expected: nenhuma linha com "useAuthStore" nos erros.

---

### Task 12: Rodar todos os testes

**Files:** Nenhum

- [ ] **Step 1: Rodar suite completa**

```bash
cd frontend && npm run test
```

Expected: todos os testes passam. Se houver falhas:
- Erros de tipo TypeScript nos testes: ajuste os imports.
- Erro `Cannot find module '@dicebear/pixel-art'` nos testes: verifique se o `vitest.config.ts` tem `environment: 'jsdom'` e se o pacote está instalado.
- Snapshot desatualizado: rode `npx vitest run --update-snapshots`.

- [ ] **Step 2: Verificar que TypeScript não tem erros no projeto todo**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -20
```

Expected: zero erros de compilação.

- [ ] **Step 3: Commit final se houver ajustes**

```bash
git add -p
git commit -m "fix(avatar): resolve remaining type errors after DiceBear migration"
```

---

### Task 13: Smoke test manual

**Files:** Nenhum

- [ ] **Step 1: Subir o servidor de desenvolvimento**

```bash
cd frontend && npm run dev
```

Abra o browser em `http://localhost:5173`.

- [ ] **Step 2: Verificar o fluxo de registro**

1. Navegue até a tela de registro.
2. Complete o passo de dados e avance para o avatar.
3. Confirme que o `CharacterEditor` renderiza com o avatar DiceBear no painel esquerdo.
4. Clique em cada aba (Pele, Cabelo, Rosto, Roupa, Extras) e confirme que os seletores aparecem.
5. Selecione diferentes opções e confirme que o preview atualiza em tempo real.
6. Na aba Cabelo, verifique que os mini-avatares de estilo renderizam corretamente no grid.
7. Clique "Confirmar personagem" e verifique que o fluxo avança sem erros no console.

- [ ] **Step 3: Verificar avatar renderizado em outros contextos**

Confirme que o componente `Avatar` renderiza corretamente no leaderboard e em qualquer outro lugar onde seja usado.

- [ ] **Step 4: Checar console do browser**

Confirme que não há erros de JavaScript no console após completar o fluxo.
