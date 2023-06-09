import { Meteor } from 'meteor/meteor';

// ---

export async function redirectIfNotLoggedIn(isLoading: boolean, to: string) {
	if (!isLoading && !Meteor.loggingIn() && !Meteor.userId()) {
		window.location.href = to;
	}
}
