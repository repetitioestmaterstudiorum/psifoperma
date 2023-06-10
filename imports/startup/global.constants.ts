import os from 'os';
import _ from 'lodash';

// ---

// All the unchangeable (in runtime) constants go here. Everything else -> settings.
const constants = {
	app: {
		name: 'Psifoperma',
		hostname: os.hostname(),
		env: process.env.NODE_ENV || 'unknown',
		isServer: Meteor.isServer,
		isClient: Meteor.isClient,
		isDev: Meteor.isDevelopment || process.env.NODE_ENV === 'development',
		isTest: Meteor.isTest || process.env.NODE_ENV === 'test',
		isProd: Meteor.isProduction || process.env.NODE_ENV === 'production',
		isProdSimulation: false, // then uses the Sepolia dev network and doesn't deploy the contract on startup
	},
	roles: {
		admin: 'admin',
		user: 'user',
		voter: 'voter',
	} as Record<string, string>, // necessary for C.roles[C.seeds.voter.role]
	votes: {
		statuses: {
			draft: 'draft',
			active: 'active',
			completed: 'completed',
		} as Record<string, string>,
	},
	blockchain: {
		limits: {
			voterAddresses: 1000,
			numProposals: 50,
			durationInMinutes: 43200, // 30 days
		},
	},
};

export const C = _.cloneDeep(constants);
