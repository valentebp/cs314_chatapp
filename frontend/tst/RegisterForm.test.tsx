import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import RegisterForm from '../src/components/auth/RegisterForm';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockSignup = jest.fn();
jest.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({ signup: mockSignup }),
}));

const renderForm = () =>
  render(
    <MemoryRouter>
      <RegisterForm />
    </MemoryRouter>
  );

describe('RegisterForm', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders all three fields', () => {
    renderForm();
    expect(screen.getByLabelText(/^email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it('shows an error when passwords do not match', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText(/^email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'different');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it('shows an error when password is too short', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText(/^email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'abc');
    await user.type(screen.getByLabelText(/confirm password/i), 'abc');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    expect(await screen.findByText(/at least 6 characters/i)).toBeInTheDocument();
  });

  it('calls signup with email and password (no confirmPassword)', async () => {
    mockSignup.mockResolvedValueOnce({});
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText(/^email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() =>
      expect(mockSignup).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'password123',
      })
    );
  });

  it('navigates to /profile after successful registration', async () => {
    mockSignup.mockResolvedValueOnce({});
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText(/^email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/profile'));
  });

  it('shows a server error on signup failure', async () => {
    mockSignup.mockRejectedValueOnce({
      response: { data: { message: 'Email already in use.' } },
    });
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText(/^email/i), 'taken@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    expect(await screen.findByText('Email already in use.')).toBeInTheDocument();
    // Wait for the finally block's setIsSubmitting(false) to flush, avoiding act() warnings.
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /create account/i })).not.toBeDisabled()
    );
  });
});
