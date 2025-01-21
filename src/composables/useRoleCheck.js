import { useAuthStore } from '@/stores/auth';

export function useRoleCheck() {
  const authStore = useAuthStore();

  const checkRole = (requiredRole) => {
    const roles = {
      owner: ['owner'],
      moderator: ['owner', 'moderator'],
      user: ['owner', 'moderator', 'user']
    };

    const allowedRoles = roles[requiredRole] || [];
    return allowedRoles.includes(authStore.userRole);
  };

  return {
    checkRole,
    isAdmin: authStore.isAdmin,
    isModerator: authStore.isModerator,
    userRole: authStore.userRole
  };
}
