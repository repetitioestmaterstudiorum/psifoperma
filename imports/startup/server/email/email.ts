import { Email } from 'meteor/email';
import { getMemoizedSetting } from '/imports/startup/server/settings/settings.model';

// ---

export async function sendEmail({
	to,
	subject,
	text,
}: {
	to: string;
	subject: string;
	text: string;
}) {
	const fromEmail = await getMemoizedSetting('email.from', 30);

	Email.send({
		from: fromEmail,
		to,
		subject,
		text,
	});
}
