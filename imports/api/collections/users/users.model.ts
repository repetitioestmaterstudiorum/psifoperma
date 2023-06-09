import { User, UserMeta, UsersCollection } from './users.collection';
import {
	update,
	find,
	findOne,
	MeteorMongoSelector,
	FindOptions,
	UpdateModifier,
} from '/imports/api/db/db.generic-functions';
import { Accounts } from 'meteor/accounts-base';
import { addUserToRoles } from '/imports/api/collections/roles/roles.model';
import { log } from '/imports/utils/logger';
import { C } from '/imports/startup/global.constants';

// ---

export async function getWalletAndPkForUser(userId: string) {
	if (C.app.isServer) {
		const user = await findOneUser({ _id: userId });
		if (!user) {
			const errorMessage = `getWalletAndPkForUser(): user not found: ${userId}`;
			log.error(errorMessage);
			throw new Meteor.Error(errorMessage);
		}

		const { bcAddress, bcPrivateKey } = user.profile;
		if (!bcAddress || !bcPrivateKey) {
			const errorMessage = `getWalletAndPkForUser(): user does not have a wallet: ${userId}`;
			log.error(errorMessage);
			throw new Meteor.Error(errorMessage);
		}

		// eslint-disable-next-line
		const encryption = require('/imports/startup/server/encryption/encryption.ts');
		const decryptedBcPrivateKey = encryption.decrypt(bcPrivateKey);

		return { bcAddress, bcPrivateKey: decryptedBcPrivateKey };
	}
}

export async function createWalletForUser(userId: string, changingUserId: string) {
	if (C.app.isServer) {
		const user = await findOneUser({ _id: userId });
		if (!user) {
			const errorMessage = `createWalletForUser(): user not found: ${userId}`;
			log.error(errorMessage);
			throw new Meteor.Error(errorMessage);
		}

		if (user.profile.bcAddress) {
			const errorMessage = `createWalletForUser(): user already has a wallet: ${userId}`;
			log.error(errorMessage);
			throw new Meteor.Error(errorMessage);
		}

		// eslint-disable-next-line
		const bc = require('/imports/startup/server/blockchain/bc.logic.ts');
		const { address, privateKey } = bc.createWallet();

		await updateUser({ _id: userId }, changingUserId, {
			$set: { 'profile.bcAddress': address, 'profile.bcPrivateKey': privateKey },
		});
	}
}

export function getFirstEmailOrUsername(user: Partial<UserMeta>) {
	return user.emails?.[0]?.address || user.username;
}

export async function addUserByEmailPWL(email: string, roles: string[]) {
	if (C.app.isClient) return; // avoids error on the client (client-side account creation is disabled)

	const insertedUserId = await insertUser({ email });
	if (!insertedUserId) return;

	addUserToRoles(insertedUserId, roles);

	if (C.app.isServer) {
		// eslint-disable-next-line
		const bc = require('/imports/startup/server/blockchain/bc.logic.ts');
		const { address, privateKey } = bc.createWallet();
		await updateUser({ _id: insertedUserId }, insertedUserId, {
			$set: { 'profile.bcAddress': address, 'profile.bcPrivateKey': privateKey },
		});
	}

	return insertedUserId;
}

export async function getUserByEmail(email: string, options?: FindOptions) {
	// Ready to be async in the future if needed
	return (await Accounts.findUserByEmail(email, options)) as UserMeta;
}

export async function getUserById(userId: string, options?: FindOptions) {
	return await findOneUser({ _id: userId }, options);
}

export async function toggleUserActive(userId: string, isActive: boolean) {
	return await updateUser({ _id: userId }, userId, { $set: { isActive } });
}

// CRUD ------------------------------------------------------------------------

async function insertUser({
	email,
	username,
	password,
}: {
	email?: string;
	username?: string;
	password?: string;
}) {
	const insertedUserId = Accounts.createUser({
		// This is a special case where the insert generic method is not used because we need to create a Meteor user account, encrypt the password, and then create a document in the UsersCollection
		...(email ? { email } : {}),
		...(username ? { username } : {}),
		...(password ? { password } : {}),
		profile: {
			isActive: true,
		},
	});

	if (!insertedUserId) {
		await log.error(`insertUser() User not inserted: ${email || username}`);
		return;
	}

	return insertedUserId;
}

async function updateUser(
	selector: MeteorMongoSelector<User>,
	userId: UserMeta['_id'],
	modifier: UpdateModifier<User>
) {
	return await update(UsersCollection, selector, modifier, userId);
}

export function findUsers(selector: MeteorMongoSelector<User>, options: FindOptions = {}) {
	return find(UsersCollection, selector, options);
}

async function findOneUser(selector: MeteorMongoSelector<User>, options: FindOptions = {}) {
	return await findOne(UsersCollection, selector, options);
}
