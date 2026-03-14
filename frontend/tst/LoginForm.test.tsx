import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import LoginForm from '../src/components/auth/LoginForm';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockLogin = jest.fn();
jest.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin }),
}));

const renderLoginForm = () =>
  render(
    <MemoryRouter>
      <LoginForm />
    </MemoryRouter>
  );

describe('LoginForm', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders email and password inputs', () => {
    renderLoginForm();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('renders the submit button', () => {
    renderLoginForm();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows an error when fields are empty and form is submitted', async () => {
    const user = userEvent.setup();
    renderLoginForm();
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/required/i);
  });

  it('calls login with form values on valid submission', async () => {
    mockLogin.mockResolvedValueOnce({});
    const user = userEvent.setup();
    renderLoginForm();
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() =>
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    );
  });

  it('navigates to /home after successful login', async () => {
    mockLogin.mockResolvedValueOnce({});
    const user = userEvent.setup();
    renderLoginForm();
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/home'));
  });

  it('shows a server error message when login fails', async () => {
    mockLogin.mockRejectedValueOnce({
      response: { data: { message: 'Invalid credentials.' } },
    });
    const user = userEvent.setup();
    renderLoginForm();
    await user.type(screen.getByLabelText(/email/i), 'wrong@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText('Invalid credentials.')).toBeInTheDocument();
  });

  it('shows a fallback error when login rejects without a server message', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Network error'));
    const user = userEvent.setup();
    renderLoginForm();
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'pass');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('disables the submit button while submitting', async () => {
    mockLogin.mockReturnValueOnce(new Promise(() => {}));
    const user = userEvent.setup();
    renderLoginForm();
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
  });
});
