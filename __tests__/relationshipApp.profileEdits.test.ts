import { updateName } from '../RelationshipApp/src/api/profile';
import { usersApi } from '../shared/api/users';

jest.mock('../shared/api/users', () => ({
  usersApi: {
    updateUserProfile: jest.fn(),
  },
}));

const mockedUpdateUserProfile = usersApi.updateUserProfile as jest.Mock;

describe('profile.updateName', () => {
  beforeEach(() => {
    mockedUpdateUserProfile.mockReset();
  });

  it('calls PUT /users/:userId/profile with trimmed names and returns the saved values', async () => {
    mockedUpdateUserProfile.mockResolvedValue({
      success: true,
      user: {
        _id: 'user-123',
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: null,
        updatedAt: '2026-07-10T00:00:00.000Z',
      },
    });

    const result = await updateName('user-123', '  Ada ', ' Lovelace ');

    expect(mockedUpdateUserProfile).toHaveBeenCalledWith('user-123', {
      firstName: 'Ada',
      lastName: 'Lovelace',
    });
    expect(result).toEqual({ firstName: 'Ada', lastName: 'Lovelace' });
  });

  it('throws when the backend reports failure', async () => {
    mockedUpdateUserProfile.mockResolvedValue({ success: false, user: null });

    await expect(updateName('user-123', 'Ada', 'Lovelace')).rejects.toThrow(
      'Name update failed'
    );
  });

  it('rejects an empty user id without calling the backend', async () => {
    await expect(updateName('', 'Ada', 'Lovelace')).rejects.toThrow(
      'No signed-in user'
    );
    expect(mockedUpdateUserProfile).not.toHaveBeenCalled();
  });

  it('rejects an empty first name without calling the backend', async () => {
    await expect(updateName('user-123', '   ', 'Lovelace')).rejects.toThrow(
      'First name is required'
    );
    expect(mockedUpdateUserProfile).not.toHaveBeenCalled();
  });
});
