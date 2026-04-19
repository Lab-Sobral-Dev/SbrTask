import { useState, useMemo } from 'react';
import { Check } from 'lucide-react';
import { createAvatar } from '@dicebear/core';
import { create, meta, schema } from '@dicebear/pixel-art';
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

const pixelArtStyle = { meta, schema, create };

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
    () => createAvatar(pixelArtStyle, { ...buildOptions(base), ...overrides }).toString(),
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
