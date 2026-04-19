# Avatar DiceBear pixel-art — Design Spec

**Data:** 2026-04-18  
**Status:** Aprovado  
**Escopo:** Substituir o sistema de avatar SVG handcrafted pelo DiceBear pixel-art (npm local), mantendo o editor de customização e migrando o schema.

---

## Contexto

O sistema atual gera avatares pixel art via SVG puro com sprites hardcoded (~380 linhas em `Avatar.tsx`). A manutenção é cara, não escala bem e o visual é limitado. A decisão é migrar para o DiceBear pixel-art com pacote npm local (sem chamadas HTTP), mantendo o editor de personalização e fazendo corte limpo no schema.

---

## Decisões tomadas

| Decisão | Escolha |
|---------|---------|
| Biblioteca | DiceBear |
| Estilo | pixel-art |
| Customização | Manter editor completo |
| Integração | `@dicebear/core` + `@dicebear/pixel-art` (npm local, client-side) |
| Schema | Migrar para params nativos DiceBear (corte limpo, sem retrocompat) |

---

## Seção 1 — Novo tipo `AvatarData`

```typescript
// frontend/src/types/index.ts
export interface AvatarData {
  skinColor: string;       // "light" | "mellow" | "warm" | "honey" | "brown" | "darkBrown" | "bronze" | "ebony" | "black"
  hair: string;            // "short01"–"short19" | "long01"–"long26"
  hairColor: string;       // "auburn" | "black" | "blonde" | "blondeGolden" | "brown" | "brownDark" | "pastelPink" | "platinum" | "red" | "silverGray"
  eyes: string;            // "variant01"–"variant26"
  eyebrows: string;        // "variant01"–"variant14"
  mouth: string;           // "happy01"–"happy06" | "sad01"–"sad02" | etc.
  beard: string | null;    // "variant01"–"variant05" | null
  clothing: string;        // "variant01"–"variant20"
  clothingColor: string;   // "black" | "blue01" | "blue02" | "gray01" | "gray02" | "heather" | "pastelBlue" | "pastelGreen" | "pastelOrange" | "pastelRed" | "pastelYellow" | "pink" | "red" | "white"
  accessories: string[];   // ("glasses" | "sunglasses" | "variant01"–"variant06")[]
  backgroundColor: string; // hex sem "#" (ex: "1e293b")
}
```

**Default:**
```json
{
  "skinColor": "warm",
  "hair": "short01",
  "hairColor": "brown",
  "eyes": "variant01",
  "eyebrows": "variant01",
  "mouth": "happy01",
  "beard": null,
  "clothing": "variant01",
  "clothingColor": "blue01",
  "accessories": [],
  "backgroundColor": "1e293b"
}
```

---

## Seção 2 — Componente `Avatar.tsx`

Wrapper fino sobre DiceBear. De ~380 linhas para ~35.

```tsx
// frontend/src/components/character/Avatar.tsx
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
    const avatar = createAvatar(pixelArt, {
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
    return avatar.toString();
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
```

**Notas:**
- `useMemo` evita regerar o SVG a cada render
- `dangerouslySetInnerHTML` é seguro: SVG vem do pacote local, não de input do usuário
- Interface pública idêntica ao atual (`data`, `size`, `className`) — consumers não mudam

---

## Seção 3 — Editor `CharacterEditor.tsx`

Mesma estrutura de 5 abas, novos campos e componentes auxiliares.

### Abas

| Aba | Campos | UI |
|-----|--------|----|
| **Pele** | `skinColor` | Swatches de cor (9 tons com hex mapeado) |
| **Cabelo** | `hair` + `hairColor` | Grid de mini-avatares (estilos) + swatches (cor) |
| **Rosto** | `eyes` + `eyebrows` + `mouth` | Grid de mini-avatares por grupo |
| **Roupa** | `clothing` + `clothingColor` | Grid de mini-avatares + swatches |
| **Extras** | `beard` + `accessories` + `backgroundColor` | Mini-avatares (barba), toggles (acessórios), swatch (fundo) |

### Componentes auxiliares (inline no editor)

**`MiniAvatar`:** Renderiza um avatar DiceBear pequeno (48px) com um override específico aplicado sobre o estado base. Usado para pré-visualizar variantes no grid.

```tsx
const MiniAvatar = ({ base, overrides, isSelected, onSelect }) => {
  const svg = useMemo(() =>
    createAvatar(pixelArt, { ...buildDiceBearOptions(base), ...overrides }).toString()
  , [base, overrides]);

  return (
    <button
      onClick={onSelect}
      className={cn(
        'rounded border-2 p-0.5 transition-colors',
        isSelected ? 'border-[color:var(--tf-primary)]' : 'border-[color:var(--tf-border-soft)]'
      )}
    >
      <div dangerouslySetInnerHTML={{ __html: svg }} style={{ width: 48, height: 48 }} />
    </button>
  );
};
```

**`VariantPicker`:** Grid scrollável de `MiniAvatar` com `max-h-[280px] overflow-y-auto` para listas longas (ex: 45 estilos de cabelo, 26 variantes de olhos).

### Estado inicial padrão

```ts
const DEFAULT_AVATAR: AvatarData = {
  skinColor: 'warm', hair: 'short01', hairColor: 'brown',
  eyes: 'variant01', eyebrows: 'variant01', mouth: 'happy01',
  beard: null, clothing: 'variant01', clothingColor: 'blue01',
  accessories: [], backgroundColor: '1e293b',
};
```

---

## Seção 4 — Migration e arquivos afetados

### Instalação

```bash
npm install @dicebear/core @dicebear/pixel-art
```

### Arquivos a modificar

| Arquivo | Mudança |
|---------|---------|
| `frontend/src/types/index.ts` | Substituir `AvatarData` pelo novo tipo |
| `frontend/src/components/character/Avatar.tsx` | Reescrever completo (~380 → ~35 linhas) |
| `frontend/src/components/character/CharacterEditor.tsx` | Novos seletores + `MiniAvatar` + `VariantPicker` |
| `frontend/src/pages/Register.tsx` | Atualizar `initialData` default |
| `frontend/src/hooks/useAuthStore.ts` | Verificar e ajustar cast do campo `avatar` |

### Arquivo a criar

| Arquivo | Conteúdo |
|---------|---------|
| `frontend/src/components/character/avatar-options.ts` | Constantes das opções DiceBear: skin tones com hex, hair colors com hex, listas de variantes, clothing colors com hex |

### Prisma schema

Apenas o `@default` muda — sem migration de dados:

```prisma
avatar Json? @default("{\"skinColor\":\"warm\",\"hair\":\"short01\",\"hairColor\":\"brown\",\"eyes\":\"variant01\",\"eyebrows\":\"variant01\",\"mouth\":\"happy01\",\"beard\":null,\"clothing\":\"variant01\",\"clothingColor\":\"blue01\",\"accessories\":[],\"backgroundColor\":\"1e293b\"}")
```

Usuários existentes verão o avatar resetado ao padrão na próxima abertura do editor — comportamento esperado numa migração de schema de avatar.

**Backend:** Nenhum handler de rota muda. O campo `avatar` continua sendo salvo/lido como JSON opaco.

---

## Fora de escopo

- Animações idle do avatar
- Upload de foto de perfil
- Migração automática de dados existentes (usuários recebem default)
- Suporte a outros estilos DiceBear além de pixel-art
