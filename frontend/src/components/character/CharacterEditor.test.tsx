import { render, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import CharacterEditor from './CharacterEditor';
import { DEFAULT_AVATAR } from './avatar-options';

// Mock dicebear modules (same as Avatar.test.tsx)
vi.mock('@dicebear/core', () => ({
  createAvatar: vi.fn(() => ({
    toString: () => '<svg></svg>',
  })),
}));

vi.mock('@dicebear/pixel-art', () => ({
  meta: {},
  schema: {},
  create: vi.fn(),
}));

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
