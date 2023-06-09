import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { requireUser } from '/imports/utils/method-utils';
import * as votes from '/imports/api/collections/votes/votes.model';
import { C } from '/imports/startup/global.constants';

// ---

Meteor.methods({
	'votes.insert': async ({ title }: { title: string }) => {
		check(title, String);
		const user = await requireUser();

		return await votes.addVote(user._id, title);
	},

	'votes.remove': async ({ voteId }: { voteId: string }) => {
		/* This error occurs: https://github.com/meteor/meteor/issues/12283 
		..if this is simulated client-side, probably because soft-deleted 
		documents get unpublished */
		if (C.app.isClient) return;

		check(voteId, String);
		const user = await requireUser();

		return await votes.deleteVote(voteId, user._id);
	},

	'votes.updateDescription': async ({
		voteId,
		description,
	}: {
		voteId: string;
		description: string;
	}) => {
		check(voteId, String);
		check(description, String);
		const user = await requireUser();

		return await votes.updateVoteDescription(voteId, user._id, description);
	},

	'votes.updateTitle': async ({ voteId, title }: { voteId: string; title: string }) => {
		check(voteId, String);
		check(title, String);
		const user = await requireUser();

		return await votes.updateVoteTitle(voteId, user._id, title);
	},

	'votes.updateDurationInMinutes': async ({
		voteId,
		durationInMinutes,
	}: {
		voteId: string;
		durationInMinutes: number;
	}) => {
		check(voteId, String);
		check(durationInMinutes, Number);
		const user = await requireUser();

		return await votes.updateVoteDurationInMinutes(voteId, user._id, durationInMinutes);
	},

	'votes.updateOptions': async ({ voteId, options }: { voteId: string; options: string[] }) => {
		check(voteId, String);
		check(options, Array);
		const user = await requireUser();

		return await votes.updateVoteOptions(voteId, user._id, options);
	},

	'votes.updateVoters': async ({ voteId, voters }: { voteId: string; voters: string[] }) => {
		check(voteId, String);
		check(voters, Array);
		const user = await requireUser();

		return await votes.updateVoteVoters(voteId, user._id, voters);
	},

	'votes.launch': async ({ voteId }: { voteId: string }) => {
		check(voteId, String);
		const user = await requireUser();

		return await votes.launchVote(voteId, user._id);
	},

	'votes.vote': async ({ voteId, optionIndex }: { voteId: string; optionIndex: string }) => {
		check(voteId, String);
		check(optionIndex, String);
		const user = await requireUser();

		return await votes.vote(voteId, user._id, optionIndex);
	},

	'votes.getVoteState': async ({ voteId, userId }: { voteId: string; userId: string }) => {
		check(voteId, String);
		check(userId, String);
		const user = await requireUser();

		return await votes.getVoteState({ voteId, userId: user._id });
	},
});
