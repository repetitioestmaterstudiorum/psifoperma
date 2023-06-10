import '/imports/startup/server/publications';
import '/imports/startup/server/accounts-config';
import '/imports/startup/server/email-config';
import '/imports/startup/server/security/ddp-config';
import '/imports/startup/server/fixtures';
import '/imports/startup/methods';
import '/imports/startup/server/blockchain/bc.devNetwork';
import '/imports/startup/server/blockchain/bc.logic';
import '/imports/startup/server/blockchain/bc.methods';
import '/imports/startup/server/encryption/encryption';
if (C.app.isDev) {
	// @ts-ignore
	import '/imports/startup/server/blockchain/bc.gas';
}
import { Meteor } from 'meteor/meteor';
import { log } from '/imports/utils/logger';
import { C } from '/imports/startup/global.constants';

// ---

Meteor.startup(async () => {
	log.info(`chitta vritti nirodha`);
});
