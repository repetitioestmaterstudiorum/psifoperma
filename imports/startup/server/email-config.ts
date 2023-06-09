import { Accounts } from 'meteor/accounts-base';
import { C } from '/imports/startup/server/server.constants';
import { getMemoizedSetting, getSetting } from '/imports/startup/server/settings/settings.model';
import { log } from '/imports/utils/logger';
import { Meteor } from 'meteor/meteor';
import { Email } from 'meteor/email';
import { getFirstEmailOrUsername } from '/imports/api/collections/users/users.model';
import { encodeEmailInUrl } from '/imports/utils/email-utils';

// ---

Meteor.startup(async () => {
	Accounts.emailTemplates.siteName = C.app.name;
	Accounts.emailTemplates.from = await getMemoizedSetting('email.from', 30);

	if (C.app.isDev) {
		const originalEmailSend = Email.send;

		const sendInDev = await getSetting('email.sendInDev');
		Email.send = function (options) {
			log.info(
				`
======== Email intercepted! ========
${Object.entries(options)
	.map(
		([key, value]) =>
			// prettier-ignore
			`${key}: ${typeof value === 'object'
				? JSON.stringify(value, null, 2)
				: value}`
	)
	.join('\n')}
=====================================
				`
			);

			if (sendInDev) originalEmailSend(options);
		};
	}

	// @ts-ignore
	Accounts.emailTemplates.sendLoginToken = {
		subject() {
			return `Your login link for ${Accounts.emailTemplates.siteName}`;
		},
		// @ts-ignore
		text(user, url) {
			return `Hello ${getFirstEmailOrUsername(user)}, 

To activate your account, simply click the link below:
${encodeEmailInUrl(url)}

Best regards,
Your ${C.app.name} team`;
		},
	};
});
