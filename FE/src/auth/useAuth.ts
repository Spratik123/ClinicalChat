import { useContext } from 'react';
import { AuthContext } from './AuthContext';
import { can, type Permission } from './roles';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>.');
  return context;
}

/** `const canApprove = usePermission('approveContentChange')` */
export function usePermission(permission: Permission): boolean {
  const { user } = useAuth();
  return can(user?.role, permission);
}
