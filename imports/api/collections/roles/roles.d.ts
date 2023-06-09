declare module 'meteor/alanning:roles' {
	export const Roles: {
		createRole(role: string, options?: { unlessExists?: boolean }): void;
		addUsersToRoles(userId: string, roles: string[], scope?: string | null): void;
		userIsInRole(userId: string, roles: string[]): boolean;
		removeUsersFromRoles(userId: string, roles: string[]): void;
		getRolesForUser(userId: string): string[];
	};
}
