import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Login from './Login';

vi.mock('../services/api', () => ({
  auth: {
    login: vi.fn(),
  },
}));

vi.mock('../hooks/useAuthStore', () => ({
  useAuthStore: (selector: (s: any) => any) =>
    selector({ setAuth: vi.fn(), isInitializing: false }),
}));

const renderLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  );

describe('Login page', () => {
  it('renders username and password fields', () => {
    renderLogin();
    expect(screen.getByLabelText(/usuário de rede/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
  });

  it('submit button is disabled when fields are empty', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeDisabled();
  });

  it('submit button is enabled when both fields have values', () => {
    renderLogin();
    fireEvent.change(screen.getByLabelText(/usuário de rede/i), { target: { value: 'joao' } });
    fireEvent.change(screen.getByLabelText(/senha/i), { target: { value: 'secret' } });
    expect(screen.getByRole('button', { name: /entrar/i })).not.toBeDisabled();
  });

  it('shows error message on 401', async () => {
    const { auth } = await import('../services/api');
    (auth.login as ReturnType<typeof vi.fn>).mockRejectedValueOnce({
      response: { status: 401 },
    });

    renderLogin();
    fireEvent.change(screen.getByLabelText(/usuário de rede/i), { target: { value: 'bad' } });
    fireEvent.change(screen.getByLabelText(/senha/i), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() =>
      expect(screen.getByText(/usuário ou senha inválidos/i)).toBeInTheDocument(),
    );
  });

  it('shows restricted error on 403', async () => {
    const { auth } = await import('../services/api');
    (auth.login as ReturnType<typeof vi.fn>).mockRejectedValueOnce({
      response: { status: 403 },
    });

    renderLogin();
    fireEvent.change(screen.getByLabelText(/usuário de rede/i), { target: { value: 'remote' } });
    fireEvent.change(screen.getByLabelText(/senha/i), { target: { value: 'pass' } });
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() =>
      expect(screen.getByText(/acesso restrito/i)).toBeInTheDocument(),
    );
  });
});
