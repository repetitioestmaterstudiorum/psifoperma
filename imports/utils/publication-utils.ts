import { UserMeta } from '/imports/api/collections/users/users.collection';

// ---

export async function getUser() {
	const user = await Meteor.userAsync();

	return user as UserMeta | null;
}
