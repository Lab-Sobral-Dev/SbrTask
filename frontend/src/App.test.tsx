import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the application brand on the login screen', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /sbrtask/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /entrar/i })).toBeInTheDocument();
});
