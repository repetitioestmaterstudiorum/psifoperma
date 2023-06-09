import { C as globalC } from '/imports/startup/global.constants';
import _ from 'lodash';

// ---

const clientConstants = {
	...globalC,
	routes: {
		home: '/',
		votes: '/votes',
		vote: '/vote/:voteId',
		login: '/login',
		checkYourEmail: '/check-your-email',
		admin: '/admin',
		loading: '/loading',
		fourOFour: '/404',
		legal: '/legal',
	},
};

export const C = _.cloneDeep(clientConstants);
