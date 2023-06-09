import { getIsAdmin } from '/imports/api/collections/roles/roles.model';
import { UserMeta } from '/imports/api/collections/users/users.collection';

// ---

export async function requireUser() {
	const user = await Meteor.userAsync();

	if (!user) {
		throw new Meteor.Error('Not authorized.');
	}

	return user as UserMeta;
}

export async function requireAdmin() {
	const user = await requireUser();
	const isAdmin = getIsAdmin(user._id);

	if (!isAdmin) throw new Meteor.Error('Not authorized.');

	return user;
}
