import { Meteor } from 'meteor/meteor';
import { getIsAdmin } from '/imports/api/collections/roles/roles.model';

// ---

Meteor.publish(null, function () {
	if (!this.userId) return this.ready();

	const isAdmin = getIsAdmin(this.userId);

	return isAdmin
		? // @ts-ignore --> not properly typed in @types/meteor or the roles package
		  Meteor.roleAssignment.find({})
		: // @ts-ignore
		  Meteor.roleAssignment.find({ 'user._id': this.userId });
});
