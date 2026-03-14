import { render, screen } from '@testing-library/react';
import AvatarDisplay from '../src/components/profile/AvatarDisplay';

describe('AvatarDisplay', () => {
  it('renders an image when src is provided', () => {
    render(<AvatarDisplay src="https://example.com/photo.jpg" name="Alice" />);
    expect(screen.getByRole('img', { name: 'Alice' })).toBeInTheDocument();
  });

  it('renders the first initial when no src is provided', () => {
    render(<AvatarDisplay name="Bob" />);
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('renders "?" when no name or src is provided', () => {
    render(<AvatarDisplay />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('applies the correct size class', () => {
    const { container } = render(<AvatarDisplay name="Alice" size="large" />);
    expect(container.firstChild).toHaveClass('avatar--large');
  });
});
