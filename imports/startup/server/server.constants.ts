import { C as globalC } from '/imports/startup/global.constants';
import _ from 'lodash';
import { log } from '/imports/utils/logger';

// ---

const serverConstants = {
	...globalC,
	seeds: {
		admin: {
			email: process.env.ADMIN_EMAIL_SEED || 'admin@app.com',
			roles: ['user', 'admin'],
		},
		user: {
			email: process.env.DEMO_EMAIL_SEED || 'user@app.com',
			roles: ['user'],
		},
		voter: {
			email: process.env.VOTER_EMAIL_SEED || 'voter@app.com',
			roles: ['voter'],
		},
	},
	encryption: {
		pw: process.env.ENCRYPTION_PW || 'password',
	},
	blockchain: {
		...globalC.blockchain,
		ganacheOptions: {
			mnemonic: 'ice defense unaware scan sure focus common barely laugh blanket bring game',
			blockTime: 0,
			network_id: 5777,
			debug: true,
			console: () => ({
				log: log.info,
				error: log.error,
			}),
		},
		ganachePort: 9874,
		networkAddress: process.env.BLOCKCHAIN_NETWORK_ADDRESS || 'http://localhost:9874',
	},
};

export const C = _.cloneDeep(serverConstants);
