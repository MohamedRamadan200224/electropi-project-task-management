import { register, login, forgotPassword, resetPassword } from '../services/auth.service';
import { User } from '../models/User';
import * as jwtUtils from '../utils/jwt';
import bcrypt from 'bcryptjs';

jest.mock('../models/User');
jest.mock('bcryptjs');
jest.mock('../utils/jwt');
jest.mock('../utils/email'); // prevent actual emails in tests

const mockUser = {
  _id: 'user123',
  name: 'Test User',
  email: 'test@example.com',
  password: 'hashed',
  role: 'member' as const,
};

describe('AuthService.register', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates a user and returns a token', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
    (User.create as jest.Mock).mockResolvedValue(mockUser);
    (jwtUtils.signToken as jest.Mock).mockReturnValue('mock_token');

    const result = await register({ name: 'Test User', email: 'test@example.com', password: 'secret123' });

    expect(result.token).toBe('mock_token');
    expect(result.user.email).toBe('test@example.com');
    expect(bcrypt.hash).toHaveBeenCalledWith('secret123', 12);
  });

  it('throws 409 when email already exists', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(mockUser);

    await expect(
      register({ name: 'Test', email: 'test@example.com', password: 'secret123' }),
    ).rejects.toMatchObject({ statusCode: 409, message: 'Email already in use' });
  });
});

describe('AuthService.login', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns token on valid credentials', async () => {
    (User.findOne as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser),
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (jwtUtils.signToken as jest.Mock).mockReturnValue('mock_token');

    const result = await login({ email: 'test@example.com', password: 'secret123' });

    expect(result.token).toBe('mock_token');
  });

  it('throws 401 when user not found', async () => {
    (User.findOne as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    await expect(
      login({ email: 'no@one.com', password: 'wrong' }),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it('throws 401 on wrong password', async () => {
    (User.findOne as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser),
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      login({ email: 'test@example.com', password: 'wrongpass' }),
    ).rejects.toMatchObject({ statusCode: 401 });
  });
});

describe('AuthService.forgotPassword', () => {
  beforeEach(() => jest.clearAllMocks());

  it('saves reset token and sends email when user exists', async () => {
    const saveMock = jest.fn().mockResolvedValue(undefined);
    (User.findOne as jest.Mock).mockResolvedValue({ ...mockUser, save: saveMock });

    const { sendPasswordResetEmail } = jest.requireMock('../utils/email') as {
      sendPasswordResetEmail: jest.Mock;
    };
    sendPasswordResetEmail.mockResolvedValue(undefined);

    await forgotPassword('test@example.com');

    expect(saveMock).toHaveBeenCalled();
    expect(sendPasswordResetEmail).toHaveBeenCalledWith(
      mockUser.email,
      mockUser.name,
      expect.any(String),
    );
  });

  it('returns silently when email does not exist (no enumeration)', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(null);

    const { sendPasswordResetEmail } = jest.requireMock('../utils/email') as {
      sendPasswordResetEmail: jest.Mock;
    };

    await expect(forgotPassword('unknown@example.com')).resolves.toBeUndefined();
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });
});

describe('AuthService.resetPassword', () => {
  beforeEach(() => jest.clearAllMocks());

  it('resets password and sends success email on valid token', async () => {
    const saveMock = jest.fn().mockResolvedValue(undefined);
    const userWithToken = {
      ...mockUser,
      resetPasswordToken: 'hashed',
      resetPasswordExpires: new Date(Date.now() + 60000),
      save: saveMock,
    };
    (User.findOne as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(userWithToken),
    });
    (bcrypt.hash as jest.Mock).mockResolvedValue('new_hashed_password');

    const { sendPasswordResetSuccessEmail } = jest.requireMock('../utils/email') as {
      sendPasswordResetSuccessEmail: jest.Mock;
    };
    sendPasswordResetSuccessEmail.mockResolvedValue(undefined);

    await resetPassword('raw_token_value', 'newpassword123');

    expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 12);
    expect(userWithToken.password).toBe('new_hashed_password');
    expect(userWithToken.resetPasswordToken).toBeUndefined();
    expect(userWithToken.resetPasswordExpires).toBeUndefined();
    expect(saveMock).toHaveBeenCalled();
    expect(sendPasswordResetSuccessEmail).toHaveBeenCalledWith(mockUser.email, mockUser.name);
  });

  it('throws 400 on invalid or expired token', async () => {
    (User.findOne as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    await expect(resetPassword('bad_token', 'newpassword123')).rejects.toMatchObject({
      statusCode: 400,
      message: 'Reset token is invalid or has expired',
    });
  });
});
