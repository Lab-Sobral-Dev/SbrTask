import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import TaskChecklistForm from './TaskChecklistForm';
import { emptyChecklistValue } from '../../lib/taskChecklist';

describe('TaskChecklistForm', () => {
  it('starts with 0 XP bônus quando nada está marcado feito', () => {
    render(<TaskChecklistForm value={emptyChecklistValue()} onChange={vi.fn()} />);
    expect(screen.getByText('+0 XP bônus')).toBeInTheDocument();
  });

  it('não oferece opção N/A pros 4 itens obrigatórios', () => {
    render(<TaskChecklistForm value={emptyChecklistValue()} onChange={vi.fn()} />);
    expect(screen.getAllByLabelText('N/A')).toHaveLength(7);
  });

  it('soma o xpWeight do item ao marcar "Feito"', () => {
    const onChange = vi.fn();
    const { rerender } = render(<TaskChecklistForm value={emptyChecklistValue()} onChange={onChange} />);
    fireEvent.click(screen.getAllByLabelText('Feito')[0]); // primeiro item = 'prd', peso 10
    rerender(<TaskChecklistForm value={onChange.mock.calls[0][0]} onChange={onChange} />);
    expect(screen.getByText('+10 XP bônus')).toBeInTheDocument();
  });

  it('mostra campo de justificativa ao marcar um item opcional como N/A', () => {
    const onChange = vi.fn();
    const { rerender } = render(<TaskChecklistForm value={emptyChecklistValue()} onChange={onChange} />);
    fireEvent.click(screen.getAllByLabelText('N/A')[0]);
    rerender(<TaskChecklistForm value={onChange.mock.calls[0][0]} onChange={onChange} />);
    expect(screen.getByPlaceholderText('Por que não se aplica?')).toBeInTheDocument();
  });
});
