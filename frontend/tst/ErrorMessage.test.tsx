import { render, screen } from '@testing-library/react';
import ErrorMessage from '../src/components/shared/ErrorMessage';

describe('ErrorMessage', () => {
  it('renders nothing when message is falsy', () => {
    const { container } = render(<ErrorMessage message="" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the message text when provided', () => {
    render(<ErrorMessage message="Something went wrong." />);
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
  });

  it('has role="alert" for accessibility', () => {
    render(<ErrorMessage message="Error!" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders nothing when message is null', () => {
    const { container } = render(<ErrorMessage message={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
