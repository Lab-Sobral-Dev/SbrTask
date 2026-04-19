# Avatar Customization — Design Spec

**Data:** 2026-04-19  
**Status:** Aprovado  
**Escopo:** `frontend/src/components/character/`, `frontend/src/types/index.ts`

---

## Problema

O sistema de customização de avatares DiceBear pixel-art contém bugs críticos onde seleções de olhos, cabelos, boca e acessórios renderizam branco/nada. Além disso, dois componentes completos do DiceBear (óculos e chapéu) nunca foram integrados, e a aba de sobrancelhas não tem efeito visual algum.

---

## Bugs a corrigir

| Categoria | Problema | Correção |
|-----------|----------|----------|
| Olhos | `EYE_VARIANTS` declara `variant01–26`, DiceBear tem apenas `variant01–12` | Reduzir para `variant01–12` |
| Cabelo | `HAIR_STYLES` declara `long01–26`, DiceBear tem `long01–21`. Faltam `short20–24` | Corrigir para `long01–21` + `short01–24` |
| Boca | `surprised01`, `surprised02` não existem. Faltam `happy07–13` e `sad03–10` | Remover inválidos, adicionar variantes reais |
| Acessórios | `glasses`, `sunglasses`, `variant05`, `variant06` não existem (só há `variant01–04`) | Remover inválidos |
| Sobrancelhas | Componente não existe no DiceBear pixel-art — aba sem efeito visual | Remover campo `eyebrows` do `AvatarData` e do editor |

---

## Novas funcionalidades

### Óculos (glasses)
- **14 variantes:** `light01–light07` (armações claras) e `dark01–dark07` (armações escuras)
- **Cor:** paleta dedicada via `glassesColor` (hex sem `#`)
- **UI:** seção nova na aba **Rosto**, substituindo sobrancelhas
- Seleção via `MiniAvatar` igual ao padrão existente
- Opção "Sem óculos" (null)

### Chapéu (hat)
- **10 variantes:** `variant01–variant10`
- **Cor:** paleta dedicada via `hatColor` (hex sem `#`)
- **UI:** seção nova na aba **Extras**, junto com Barba e Acessórios
- Seleção via `MiniAvatar`
- Opção "Sem chapéu" (null)

---

## Expansões (opções faltantes adicionadas)

| Categoria | Antes | Depois |
|-----------|-------|--------|
| Barba | `variant01–05` (5) | `variant01–08` (8) |
| Roupa | `variant01–20` (20) | `variant01–23` (23) |
| Boca | 10 opções (2 inválidas) | 23 opções válidas (`happy01–13`, `sad01–10`) |
| Cabelo | 45 (5 inválidos) | 45 válidos (`short01–24` + `long01–21`) |

---

## Mudanças no tipo AvatarData

```ts
// Remover:
eyebrows: string

// Adicionar:
glasses: string | null      // null = sem óculos
glassesColor: string        // hex sem '#', ex: 'a0a0a0'
hat: string | null          // null = sem chapéu
hatColor: string            // hex sem '#', ex: '1e293b'
```

**Paleta de óculos** (`GLASSES_COLORS`, 8 entradas):
```
{ id: 'a0a0a0', hex: '#a0a0a0' }  // prata
{ id: 'ffd700', hex: '#ffd700' }  // ouro
{ id: 'b87333', hex: '#b87333' }  // cobre
{ id: '252525', hex: '#252525' }  // preto
{ id: 'f5f5f5', hex: '#f5f5f5' }  // branco
{ id: '5199e4', hex: '#5199e4' }  // azul
{ id: 'ff5c5c', hex: '#ff5c5c' }  // vermelho
{ id: 'ca9849', hex: '#ca9849' }  // dourado envelhecido
```

**Paleta de chapéu** (hatColor): reutiliza `CLOTHING_COLORS` — mesma paleta, sem nova constante.

**DEFAULT_AVATAR novos campos:**
```ts
glasses: null,
glassesColor: 'a0a0a0',  // prata
hat: null,
hatColor: '252525',       // preto
```

---

## Estrutura de abas (CharacterEditor)

| Aba | Seções |
|-----|--------|
| Pele | Tom de pele (9 tons) |
| Cabelo | Estilo (45 válidos) + Cor do cabelo (10) |
| Rosto | Olhos (12) + Boca (23) + Óculos (14 + cor, com "Sem óculos") |
| Roupa | Roupa (23) + Cor da roupa (14) |
| Extras | Barba (8 + "Sem barba") + Chapéu (10 + cor + "Sem chapéu") + Acessórios (4) |

---

## Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `src/types/index.ts` | Remover `eyebrows`, adicionar `glasses`, `glassesColor`, `hat`, `hatColor` |
| `src/components/character/avatar-options.ts` | Corrigir todos os arrays inválidos; adicionar `GLASSES_VARIANTS`, `GLASSES_COLORS`, `HAT_VARIANTS`; atualizar `DEFAULT_AVATAR` |
| `src/components/character/Avatar.tsx` | Atualizar `createAvatar` — remover `eyebrows`, adicionar `glasses`, `glassesProbability`, `hat`, `hatProbability`, `glassesColor`, `hatColor` |
| `src/components/character/CharacterEditor.tsx` | Atualizar `buildOptions`; substituir seção de sobrancelhas por óculos na aba Rosto; adicionar chapéu na aba Extras |
| `src/components/character/avatar-options.test.ts` | Atualizar contagens e campos do `DEFAULT_AVATAR` |
| `src/components/character/Avatar.test.tsx` | Atualizar teste do `DEFAULT_AVATAR` se necessário |

---

## Decisões de design

- `hatColor` reutiliza `CLOTHING_COLORS` — mesma paleta, sem nova constante
- `glassesColor` tem paleta própria (`GLASSES_COLORS`) — tons de metal que fazem sentido para armações
- Óculos e chapéu usam `MiniAvatar` igual ao padrão de cabelo/roupa/olhos
- `beardProbability: 0/100` permanece o mesmo padrão; `glassesProbability` e `hatProbability` seguem o mesmo padrão
- Backend: avatar é armazenado como JSON — nenhuma migration Prisma necessária; campos novos são ignorados em avatares antigos e preenchidos com `DEFAULT_AVATAR` no fluxo de registro
