/**
 * Permission utility functions for checking user permissions
 * Supports dot notation (profile.view, security.email.edit) and wildcard patterns (profile.*, security.email.*)
 */

/**
 * Check if a user has a specific permission
 * Supports wildcard matching: profile.* matches profile.view, profile.edit, etc.
 *
 * @param userPermissions - Array of permissions the user has
 * @param required - The required permission to check
 * @returns true if user has the permission, false otherwise
 */
export function hasPermission(userPermissions: string[], required: string): boolean {
  if (!userPermissions || userPermissions.length === 0) {
    return false;
  }

  // Direct match
  if (userPermissions.includes(required)) {
    return true;
  }

  // Check for wildcard permissions
  // e.g., if user has "profile.*", they have "profile.view", "profile.edit", etc.
  const requiredParts = required.split('.');

  for (const permission of userPermissions) {
    if (permission.endsWith('.*')) {
      const permissionBase = permission.slice(0, -2); // Remove the ".*"
      const permissionParts = permissionBase.split('.');

      // Check if the required permission starts with the wildcard base
      // e.g., "profile.*" should match "profile.view"
      // e.g., "security.email.*" should match "security.email.edit"
      if (requiredParts.length > permissionParts.length) {
        const requiredBase = requiredParts.slice(0, permissionParts.length).join('.');
        if (requiredBase === permissionBase) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Check if a user has ANY of the required permissions
 *
 * @param userPermissions - Array of permissions the user has
 * @param required - Array of required permissions (user needs at least one)
 * @returns true if user has at least one of the required permissions
 */
export function hasAnyPermission(userPermissions: string[], required: string[]): boolean {
  if (!userPermissions || userPermissions.length === 0) {
    return false;
  }

  if (!required || required.length === 0) {
    return false;
  }

  return required.some(req => hasPermission(userPermissions, req));
}

/**
 * Check if a user has ALL of the required permissions
 *
 * @param userPermissions - Array of permissions the user has
 * @param required - Array of required permissions (user needs all of them)
 * @returns true if user has all required permissions
 */
export function hasAllPermissions(userPermissions: string[], required: string[]): boolean {
  if (!userPermissions || userPermissions.length === 0) {
    return false;
  }

  if (!required || required.length === 0) {
    return true; // No permissions required
  }

  return required.every(req => hasPermission(userPermissions, req));
}

/**
 * Check if a permission pattern matches a wildcard
 *
 * @param userPermissions - Array of permissions the user has
 * @param pattern - The wildcard pattern to check (e.g., "profile.*")
 * @returns true if user has the wildcard permission
 */
export function matchesWildcard(userPermissions: string[], pattern: string): boolean {
  if (!userPermissions || userPermissions.length === 0) {
    return false;
  }

  return userPermissions.includes(pattern);
}

/**
 * Expand a wildcard permission into all possible permissions
 *
 * @param wildcard - The wildcard permission (e.g., "profile.*")
 * @param actions - Array of possible actions (e.g., ["view", "create", "edit", "delete"])
 * @returns Array of expanded permissions
 */
export function expandWildcard(wildcard: string, actions: string[] = ['view', 'create', 'edit', 'delete']): string[] {
  if (!wildcard.endsWith('.*')) {
    return [wildcard];
  }

  const base = wildcard.slice(0, -2);
  return actions.map(action => `${base}.${action}`);
}

/**
 * Get a human-readable label for a permission
 *
 * @param permission - The permission string (e.g., "profile.view" or "security.email.edit")
 * @returns Human-readable label
 */
export function getPermissionLabel(permission: string): string {
  if (permission.endsWith('.*')) {
    const base = permission.slice(0, -2);
    const parts = base.split('.');
    const module = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
    return `All ${module} Actions`;
  }

  const parts = permission.split('.');
  const action = parts[parts.length - 1];
  const module = parts.slice(0, -1).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');

  return `${module} - ${action.charAt(0).toUpperCase() + action.slice(1)}`;
}

/**
 * Group permissions by module
 *
 * @param permissions - Array of permissions
 * @returns Object with modules as keys and permissions as values
 */
export function groupPermissionsByModule(permissions: string[]): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};

  for (const permission of permissions) {
    const parts = permission.split('.');
    const module = parts[0];

    if (!grouped[module]) {
      grouped[module] = [];
    }

    grouped[module].push(permission);
  }

  return grouped;
}
