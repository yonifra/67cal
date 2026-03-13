import { describe, it, expect, vi, beforeEach } from 'vitest';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { createUserProfile, getUserProfile, updateUserRole } from '../users';

// Firebase mocks are set up globally in setup.ts

describe('createUserProfile()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a new document when user does not exist', async () => {
    const mockDocRef = { id: 'user-1', path: 'users/user-1' };
    vi.mocked(doc).mockReturnValue(mockDocRef as any);
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => false,
      data: () => null,
    } as any);
    vi.mocked(setDoc).mockResolvedValue(undefined);

    await createUserProfile('user-1', {
      displayName: 'John Doe',
      email: 'john@example.com',
      role: 'teacher',
    });

    expect(doc).toHaveBeenCalledWith({}, 'users', 'user-1');
    expect(getDoc).toHaveBeenCalledWith(mockDocRef);
    expect(setDoc).toHaveBeenCalledWith(mockDocRef, {
      uid: 'user-1',
      displayName: 'John Doe',
      email: 'john@example.com',
      role: 'teacher',
      createdAt: expect.anything(),
    });
    expect(updateDoc).not.toHaveBeenCalled();
  });

  it('updates role when user already exists', async () => {
    const mockDocRef = { id: 'user-1', path: 'users/user-1' };
    vi.mocked(doc).mockReturnValue(mockDocRef as any);
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => ({
        uid: 'user-1',
        displayName: 'John Doe',
        email: 'john@example.com',
        role: 'pupil',
      }),
    } as any);
    vi.mocked(updateDoc).mockResolvedValue(undefined);

    await createUserProfile('user-1', {
      displayName: 'John Doe',
      email: 'john@example.com',
      role: 'teacher',
    });

    expect(updateDoc).toHaveBeenCalledWith(mockDocRef, { role: 'teacher' });
    expect(setDoc).not.toHaveBeenCalled();
  });
});

describe('getUserProfile()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the user profile when document exists', async () => {
    const mockProfile = {
      uid: 'user-1',
      displayName: 'Jane Doe',
      email: 'jane@example.com',
      role: 'pupil',
      createdAt: { toDate: () => new Date() },
    };

    vi.mocked(doc).mockReturnValue({ id: 'user-1' } as any);
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => mockProfile,
    } as any);

    const result = await getUserProfile('user-1');
    expect(result).toEqual(mockProfile);
  });

  it('returns null when document does not exist', async () => {
    vi.mocked(doc).mockReturnValue({ id: 'user-1' } as any);
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => false,
      data: () => undefined,
    } as any);

    const result = await getUserProfile('nonexistent');
    expect(result).toBeNull();
  });
});

describe('updateUserRole()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls updateDoc with the correct role', async () => {
    const mockDocRef = { id: 'user-1', path: 'users/user-1' };
    vi.mocked(doc).mockReturnValue(mockDocRef as any);
    vi.mocked(updateDoc).mockResolvedValue(undefined);

    await updateUserRole('user-1', 'teacher');

    expect(doc).toHaveBeenCalledWith({}, 'users', 'user-1');
    expect(updateDoc).toHaveBeenCalledWith(mockDocRef, { role: 'teacher' });
  });

  it('updates role to pupil', async () => {
    const mockDocRef = { id: 'user-2', path: 'users/user-2' };
    vi.mocked(doc).mockReturnValue(mockDocRef as any);
    vi.mocked(updateDoc).mockResolvedValue(undefined);

    await updateUserRole('user-2', 'pupil');

    expect(updateDoc).toHaveBeenCalledWith(mockDocRef, { role: 'pupil' });
  });
});
