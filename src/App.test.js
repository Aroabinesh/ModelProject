import { render, screen } from '@testing-library/react';
import App from './App';

test('renders login page by default', () => {
  render(<App />);
  const titleElement = screen.getByText(/sign in/i);
  expect(titleElement).toBeInTheDocument();
});
