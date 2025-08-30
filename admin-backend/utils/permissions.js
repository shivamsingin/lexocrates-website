// Role-based permissions configuration
const ROLE_PERMISSIONS = {
  client: [
    'read_blog',
    'view_analytics',
    'download_files'
  ],
  staff: [
    'read_blog',
    'write_blog',
    'publish_blog',
    'manage_content',
    'view_analytics',
    'view_reports',
    'download_files'
  ],
  admin: [
    'read_blog',
    'write_blog',
    'publish_blog',
    'delete_blog',
    'manage_users',
    'manage_settings',
    'view_analytics',
    'manage_content',
    'manage_billing',
    'view_reports',
    'manage_files',
    'view_file_stats',
    'view_encryption_report',
    'download_files'
  ]
};

// Permission descriptions for UI
const PERMISSION_DESCRIPTIONS = {
  read_blog: 'Read blog posts and content',
  write_blog: 'Create and edit blog posts',
  publish_blog: 'Publish blog posts',
  delete_blog: 'Delete blog posts',
  manage_users: 'Manage user accounts and permissions',
  manage_settings: 'Manage system settings',
  view_analytics: 'View analytics and statistics',
  manage_content: 'Manage all content types',
  manage_billing: 'Manage billing and subscriptions',
  view_reports: 'View system reports',
  manage_files: 'Manage and delete files',
  view_file_stats: 'View file statistics dashboard',
  view_encryption_report: 'View encryption key/report data',
  download_files: 'Download files not owned by the user'
};

class PermissionManager {
  // Get permissions for a role
  static getPermissionsForRole(role) {
    return ROLE_PERMISSIONS[role] || [];
  }

  // Check if role has permission
  static roleHasPermission(role, permission) {
    const permissions = this.getPermissionsForRole(role);
    return permissions.includes(permission);
  }

  // Check if role has any of the given permissions
  static roleHasAnyPermission(role, permissions) {
    const rolePermissions = this.getPermissionsForRole(role);
    return permissions.some(permission => rolePermissions.includes(permission));
  }

  // Check if role has all of the given permissions
  static roleHasAllPermissions(role, permissions) {
    const rolePermissions = this.getPermissionsForRole(role);
    return permissions.every(permission => rolePermissions.includes(permission));
  }

  // Get all available permissions
  static getAllPermissions() {
    return Object.keys(PERMISSION_DESCRIPTIONS);
  }

  // Get permission description
  static getPermissionDescription(permission) {
    return PERMISSION_DESCRIPTIONS[permission] || 'Unknown permission';
  }

  // Get all roles
  static getAllRoles() {
    return Object.keys(ROLE_PERMISSIONS);
  }

  // Validate role
  static isValidRole(role) {
    return this.getAllRoles().includes(role);
  }

  // Validate permission
  static isValidPermission(permission) {
    return this.getAllPermissions().includes(permission);
  }

  // Get permissions with descriptions
  static getPermissionsWithDescriptions() {
    return Object.entries(PERMISSION_DESCRIPTIONS).map(([permission, description]) => ({
      permission,
      description
    }));
  }

  // Get role permissions with descriptions
  static getRolePermissionsWithDescriptions(role) {
    const permissions = this.getPermissionsForRole(role);
    return permissions.map(permission => ({
      permission,
      description: this.getPermissionDescription(permission)
    }));
  }

  // Check if user can access resource
  static canAccessResource(user, requiredPermissions) {
    if (!user || !user.isActive) {
      return false;
    }

    if (user.role === 'admin') {
      return true; // Admin has access to everything
    }

    if (Array.isArray(requiredPermissions)) {
      return this.roleHasAnyPermission(user.role, requiredPermissions);
    }

    return this.roleHasPermission(user.role, requiredPermissions);
  }

  // Get user's effective permissions
  static getUserEffectivePermissions(user) {
    if (!user) return [];
    
    const rolePermissions = this.getPermissionsForRole(user.role);
    const customPermissions = user.permissions || [];
    
    // Combine role permissions with custom permissions
    return [...new Set([...rolePermissions, ...customPermissions])];
  }

  // Check if user has specific permission
  static userHasPermission(user, permission) {
    if (!user || !user.isActive) return false;
    
    const effectivePermissions = this.getUserEffectivePermissions(user);
    return effectivePermissions.includes(permission);
  }

  // Check if user has any of the given permissions
  static userHasAnyPermission(user, permissions) {
    if (!user || !user.isActive) return false;
    
    const effectivePermissions = this.getUserEffectivePermissions(user);
    return permissions.some(permission => effectivePermissions.includes(permission));
  }

  // Check if user has all of the given permissions
  static userHasAllPermissions(user, permissions) {
    if (!user || !user.isActive) return false;
    
    const effectivePermissions = this.getUserEffectivePermissions(user);
    return permissions.every(permission => effectivePermissions.includes(permission));
  }
}

module.exports = {
  PermissionManager,
  ROLE_PERMISSIONS,
  PERMISSION_DESCRIPTIONS
};
