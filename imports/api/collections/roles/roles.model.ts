import { Roles } from 'meteor/alanning:roles';

// ---

export function getIsAdmin(userId: string) {
	if (!userId) return false;
	return userIsInRole(userId, ['admin']);
}

export function getIsUser(userId: string) {
	if (!userId) return false;
	return userIsInRole(userId, ['user']);
}

export function getIsVoter(userId: string) {
	if (!userId) return false;
	return userIsInRole(userId, ['voter']);
}

// Roles package interaction ---------------------------------------------------

export function createRole(role: string) {
	Roles.createRole(role, { unlessExists: true });
}

export function addUserToRoles(userId: string, roles: string[], scope: string | null = null) {
	Roles.addUsersToRoles(userId, roles, scope);
}

export function userIsInRole(userId: string, roles: string[]) {
	return Roles.userIsInRole(userId, roles);
}

export function removeUsersFromRoles(userId: string, roles: string[]) {
	Roles.removeUsersFromRoles(userId, roles);
}

export function getRolesForUser(userId: string) {
	return Roles.getRolesForUser(userId);
}
