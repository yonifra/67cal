import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../authStore';

describe('authStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useAuthStore.setState({
      user: null,
      loading: true,
      role: null,
      roleLoading: true,
    });
  });

  describe('initial state', () => {
    it('has null user', () => {
      expect(useAuthStore.getState().user).toBeNull();
    });

    it('has loading set to true', () => {
      expect(useAuthStore.getState().loading).toBe(true);
    });

    it('has null role', () => {
      expect(useAuthStore.getState().role).toBeNull();
    });

    it('has roleLoading set to true', () => {
      expect(useAuthStore.getState().roleLoading).toBe(true);
    });
  });

  describe('setUser()', () => {
    it('sets user and sets loading to false', () => {
      const mockUser = { uid: 'user-1', email: 'test@test.com' } as any;
      useAuthStore.getState().setUser(mockUser);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.loading).toBe(false);
    });

    it('can set user to null', () => {
      const mockUser = { uid: 'user-1' } as any;
      useAuthStore.getState().setUser(mockUser);
      useAuthStore.getState().setUser(null);

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.loading).toBe(false);
    });
  });

  describe('setRole()', () => {
    it('sets role to teacher', () => {
      useAuthStore.getState().setRole('teacher');
      expect(useAuthStore.getState().role).toBe('teacher');
    });

    it('sets role to pupil', () => {
      useAuthStore.getState().setRole('pupil');
      expect(useAuthStore.getState().role).toBe('pupil');
    });

    it('can set role to null', () => {
      useAuthStore.getState().setRole('teacher');
      useAuthStore.getState().setRole(null);
      expect(useAuthStore.getState().role).toBeNull();
    });
  });

  describe('setLoading()', () => {
    it('sets loading to false', () => {
      useAuthStore.getState().setLoading(false);
      expect(useAuthStore.getState().loading).toBe(false);
    });

    it('sets loading to true', () => {
      useAuthStore.getState().setLoading(false);
      useAuthStore.getState().setLoading(true);
      expect(useAuthStore.getState().loading).toBe(true);
    });
  });

  describe('setRoleLoading()', () => {
    it('sets roleLoading to false', () => {
      useAuthStore.getState().setRoleLoading(false);
      expect(useAuthStore.getState().roleLoading).toBe(false);
    });

    it('sets roleLoading to true', () => {
      useAuthStore.getState().setRoleLoading(false);
      useAuthStore.getState().setRoleLoading(true);
      expect(useAuthStore.getState().roleLoading).toBe(true);
    });
  });
});
