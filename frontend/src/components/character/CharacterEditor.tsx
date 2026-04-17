import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { Avatar, AvatarData } from './Avatar';

interface CharacterEditorProps {
  initialData?: AvatarData;
  onComplete: (avatar: AvatarData) => void;
}

const hairStyles = [
  { id: 'hair-1', name: 'Curto classico' },
  { id: 'hair-2', name: 'Longo' },
  { id: 'hair-3', name: 'Ondulado' },
  { id: 'hair-4', name: 'Encaracolado' },
  { id: 'hair-5', name: 'Moicano' },
  { id: 'hair-6', name: 'Volumoso' },
  { id: 'hair-7', name: 'Raspado' },
  { id: 'hair-8', name: 'Lateral' },
  { id: 'hair-9', name: 'Presa' },
  { id: 'hair-10', name: 'Espigado' },
];

const skinTones = [
  '#F7D7C4', '#F2CDB1', '#E8C4A8', '#DEB48F', '#D4A888', '#C4906C',
  '#B47B59', '#A87858', '#94654B', '#8B5E3C', '#6B4423', '#4A3018',
];

const hairColors = [
  '#4A3728', '#2C1810', '#8B4513', '#D2691E', '#CFA15B', '#FFD700',
  '#8B0000', '#9B2C2C', '#4B0082', '#243B6B', '#000000', '#FFFFFF',
  '#FF69B4', '#00CED1',
];

const eyeColors = [
  '#4B7B4B', '#3D5A80', '#6B4423', '#4A3728', '#4682B4',
  '#8B4513', '#2E8B57', '#191970', '#8B2F6B',
];

const eyeShapes = [
  { id: 'round', name: 'Redondo' },
  { id: 'oval', name: 'Oval' },
  { id: 'almond', name: 'Amendoado' },
  { id: 'narrow', name: 'Focado' },
  { id: 'sleepy', name: 'Calmo' },
];

const outfits = [
  { id: 'outfit-1', name: 'Casual', color: '#5B7C99' },
  { id: 'outfit-2', name: 'Elegante', color: '#7B5E57' },
  { id: 'outfit-3', name: 'Verde', color: '#6B8E6B' },
  { id: 'outfit-4', name: 'Aventureiro', color: '#8B7B6B' },
  { id: 'outfit-5', name: 'Escolar', color: '#5B6B8B' },
  { id: 'outfit-6', name: 'Casaco', color: '#8A4D4D' },
  { id: 'outfit-7', name: 'Uniforme', color: '#4C5C7A' },
  { id: 'outfit-8', name: 'Cowboy', color: '#C67D3A' },
  { id: 'outfit-9', name: 'Robe', color: '#684F8F' },
  { id: 'outfit-10', name: 'Tatico', color: '#3B5E56' },
];

const facialHairStyles = [
  { id: 'none', name: 'Sem barba' },
  { id: 'mustache', name: 'Bigode' },
  { id: 'goatee', name: 'Cavanhaque' },
  { id: 'beard', name: 'Barba curta' },
  { id: 'full', name: 'Barba cheia' },
];

const accessories = [
  { id: 'glasses', name: 'Oculos', color: '#6fa8dc' },
  { id: 'hat', name: 'Chapeu', color: '#8a3131' },
  { id: 'bandana', name: 'Bandana', color: '#8a3131' },
  { id: 'visor', name: 'Visor', color: '#5f708f' },
];

const CharacterEditor: React.FC<CharacterEditorProps> = ({ initialData, onComplete }) => {
  const [avatar, setAvatar] = useState<AvatarData>(
    initialData || {
      skinTone: '#F2CDB1',
      hairStyle: 'hair-1',
      hairColor: '#4A3728',
      facialHair: 'none',
      eyes: { color: '#4B7B4B', shape: 'round' },
      outfit: 'outfit-1',
      accessories: [],
    },
  );

  const [activeTab, setActiveTab] = useState<'skin' | 'hair' | 'eyes' | 'outfit' | 'extras'>('skin');

  const tabs = [
    { id: 'skin', label: 'Pele' },
    { id: 'hair', label: 'Cabelo' },
    { id: 'eyes', label: 'Olhos' },
    { id: 'outfit', label: 'Roupa' },
    { id: 'extras', label: 'Extras' },
  ] as const;

  const updateAvatar = (updates: Partial<AvatarData>) => {
    setAvatar((prev) => ({ ...prev, ...updates }));
  };

  const toggleAccessory = (accessoryId: string) => {
    const active = avatar.accessories.includes(accessoryId);
    updateAvatar({
      accessories: active
        ? avatar.accessories.filter((item) => item !== accessoryId)
        : [...avatar.accessories, accessoryId],
    });
  };

  const choiceClass = (selected: boolean) =>
    `tf-btn ${selected ? 'tf-btn-primary' : 'tf-btn-secondary'} !px-4 !py-2 !text-sm`;

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <div className="tf-panel p-5">
        <p className="tf-title text-xs uppercase tracking-[0.16em] text-[color:var(--tf-primary)]">Retrato</p>
        <div className="mt-4 flex flex-col items-center">
          <div className="tf-frame relative w-full max-w-[220px] p-3">
            <div className="tf-panel-inset flex h-[320px] items-center justify-center p-4">
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
              <p className="mt-1 text-sm text-[color:var(--tf-text-muted)]">Mais variedade para aproximar o avatar do personagem que voce imaginou.</p>
              <div className="mt-5 flex flex-wrap gap-3">
                {skinTones.map((tone) => (
                  <button
                    key={tone}
                    onClick={() => updateAvatar({ skinTone: tone })}
                    className={`h-11 w-11 rounded-[4px] border-2 transition-transform hover:-translate-y-0.5 ${
                      avatar.skinTone === tone ? 'border-[color:var(--tf-primary)] shadow-[0_0_0_2px_rgba(217,164,65,0.25)]' : 'border-[color:var(--tf-border-soft)]'
                    }`}
                    style={{ backgroundColor: tone }}
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'hair' && (
            <div className="space-y-6">
              <div>
                <h3 className="tf-title text-lg text-[color:var(--tf-text-main)]">Estilo do cabelo</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {hairStyles.map((style) => (
                    <button key={style.id} onClick={() => updateAvatar({ hairStyle: style.id })} className={choiceClass(avatar.hairStyle === style.id)}>
                      {style.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="tf-title text-lg text-[color:var(--tf-text-main)]">Cor do cabelo</h3>
                <div className="mt-4 flex flex-wrap gap-3">
                  {hairColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => updateAvatar({ hairColor: color })}
                      className={`h-10 w-10 rounded-[4px] border-2 transition-transform hover:-translate-y-0.5 ${
                        avatar.hairColor === color ? 'border-[color:var(--tf-primary)] shadow-[0_0_0_2px_rgba(217,164,65,0.25)]' : 'border-[color:var(--tf-border-soft)]'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'eyes' && (
            <div className="space-y-6">
              <div>
                <h3 className="tf-title text-lg text-[color:var(--tf-text-main)]">Cor dos olhos</h3>
                <div className="mt-4 flex flex-wrap gap-3">
                  {eyeColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => updateAvatar({ eyes: { ...avatar.eyes, color } })}
                      className={`h-10 w-10 rounded-[4px] border-2 transition-transform hover:-translate-y-0.5 ${
                        avatar.eyes.color === color ? 'border-[color:var(--tf-primary)] shadow-[0_0_0_2px_rgba(217,164,65,0.25)]' : 'border-[color:var(--tf-border-soft)]'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <h3 className="tf-title text-lg text-[color:var(--tf-text-main)]">Formato dos olhos</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {eyeShapes.map((shape) => (
                    <button key={shape.id} onClick={() => updateAvatar({ eyes: { ...avatar.eyes, shape: shape.id } })} className={choiceClass(avatar.eyes.shape === shape.id)}>
                      {shape.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'outfit' && (
            <div>
              <h3 className="tf-title text-lg text-[color:var(--tf-text-main)]">Roupa</h3>
              <p className="mt-1 text-sm text-[color:var(--tf-text-muted)]">Mais silhuetas e fantasias para dar personalidade ao boneco.</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {outfits.map((outfit) => (
                  <button key={outfit.id} onClick={() => updateAvatar({ outfit: outfit.id })} className={choiceClass(avatar.outfit === outfit.id)}>
                    <span className="h-4 w-4 rounded-[2px] border border-black/25" style={{ backgroundColor: outfit.color }} />
                    {outfit.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'extras' && (
            <div className="space-y-6">
              <div>
                <h3 className="tf-title text-lg text-[color:var(--tf-text-main)]">Barba</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {facialHairStyles.map((style) => (
                    <button key={style.id} onClick={() => updateAvatar({ facialHair: style.id })} className={choiceClass(avatar.facialHair === style.id)}>
                      {style.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="tf-title text-lg text-[color:var(--tf-text-main)]">Acessorios</h3>
                <p className="mt-1 text-sm text-[color:var(--tf-text-muted)]">Voce pode combinar varios ao mesmo tempo.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {accessories.map((item) => (
                    <button key={item.id} onClick={() => toggleAccessory(item.id)} className={choiceClass(avatar.accessories.includes(item.id))}>
                      <span className="h-4 w-4 rounded-[2px] border border-black/25" style={{ backgroundColor: item.color }} />
                      {item.name}
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
