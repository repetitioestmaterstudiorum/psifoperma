import { Meteor } from 'meteor/meteor';
import { findVotes } from '../votes.model';
import { requireUser } from '/imports/utils/method-utils';

// ---

Meteor.publish('votes', async function () {
	if (!this.userId) return this.ready();
	const user = await requireUser();

	// return findVotes({ userId: this.userId });
	return findVotes({ $or: [{ userId: user._id }, { voters: user.emails?.[0]?.address }] });
});
