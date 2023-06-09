import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import {
	addUserByEmailPWL,
	createWalletForUser,
	getWalletAndPkForUser,
} from '/imports/api/collections/users/users.model';
import { addUserToRoles } from '/imports/api/collections/roles/roles.model';
import { requireAdmin, requireUser } from '/imports/utils/method-utils';
import { C } from '/imports/startup/global.constants';

// ---

Meteor.methods({
	'users.addUser': async function (email: string) {
		check(email, String);

		return await addUserByEmailPWL(email, ['user']);
	},

	'users.addToRole': async function (userId: string, role: string) {
		check(userId, String);
		check(role, String);
		await requireAdmin();
		const roles = Object.keys(C.roles);
		if (!roles.includes(role)) throw new Meteor.Error('Invalid role');

		return addUserToRoles(userId, [role]);
	},

	'users.createWalletForUser': async function (userId: string) {
		check(userId, String);
		const adminUser = await requireAdmin();

		return await createWalletForUser(userId, adminUser._id);
	},

	'users.getWalletAndPk': async function () {
		const user = await requireUser();

		return await getWalletAndPkForUser(user._id);
	},
});
