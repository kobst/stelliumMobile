import { deleteAccount } from '../RelationshipApp/src/api/profile';
import { usersApi } from '../shared/api/users';

jest.mock('../shared/api/users', () => ({
  usersApi: {
    deleteAccount: jest.fn(),
  },
}));

const mockedDeleteAccount = usersApi.deleteAccount as jest.Mock;

describe('profile.deleteAccount', () => {
  beforeEach(() => {
    mockedDeleteAccount.mockReset();
  });

  it('calls the backend /account/delete wrapper with the user id', async () => {
    mockedDeleteAccount.mockResolvedValue({
      success: true,
      message: 'Account deleted',
      deletionResults: {},
      totalDeleted: 12,
      firebaseAuthDeletionRequired: true,
      firebaseUid: 'uid-1',
    });

    const result = await deleteAccount('user-123');

    expect(mockedDeleteAccount).toHaveBeenCalledWith('user-123');
    expect(result.success).toBe(true);
    expect(result.firebaseAuthDeletionRequired).toBe(true);
  });

  it('throws the backend message when the backend reports failure', async () => {
    mockedDeleteAccount.mockResolvedValue({
      success: false,
      message: 'User not found',
      deletionResults: {},
      totalDeleted: 0,
      firebaseAuthDeletionRequired: false,
      firebaseUid: '',
    });

    await expect(deleteAccount('user-123')).rejects.toThrow('User not found');
  });

  it('rejects an empty user id without calling the backend', async () => {
    await expect(deleteAccount('')).rejects.toThrow('No signed-in user');
    expect(mockedDeleteAccount).not.toHaveBeenCalled();
  });
});
