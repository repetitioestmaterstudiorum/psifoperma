import { createRole } from '/imports/api/collections/roles/roles.model';
import { addUserByEmailPWL, getUserByEmail } from '/imports/api/collections/users/users.model';
import { C } from '/imports/startup/server/server.constants';
import { log } from '/imports/utils/logger';

// ---

Meteor.startup(async () => {
	for (const role of Object.values(C.roles)) {
		log.info(`Ensuring role ${role} is seeded ...`);
		createRole(role); // the package alanning:roles handles already existing roles
	}

	for (const user of Object.values(C.seeds)) {
		log.info(`Ensuring user ${user.email} is seeded ...`);
		await addFixtureUser(user);
	}
});

async function addFixtureUser(userFromConstants: typeof C.seeds.admin) {
	if (await getUserByEmail(userFromConstants.email)) return;

	await addUserByEmailPWL(userFromConstants.email, userFromConstants.roles);

	const user = await getUserByEmail(userFromConstants.email);
	if (!user) throw new Error(`User not seeded: ${userFromConstants.email}`);
}
