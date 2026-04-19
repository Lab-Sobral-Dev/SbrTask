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
