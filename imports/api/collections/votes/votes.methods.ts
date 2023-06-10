import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { requireUser } from '/imports/utils/method-utils';
import * as votes from '/imports/api/collections/votes/votes.model';
import { C } from '/imports/startup/global.constants';

// ---

Meteor.methods({
	'votes.insert': async function ({ title }: { title: string }) {
		check(title, String);
		const user = await requireUser();

		if (C.app.isServer) {
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const sanitizer = require('/imports/startup/server/security/client-input-validation.ts');
			title = sanitizer.sanitizeInput(title, 'votes.insert', user._id);
		}

		return await votes.addVote(user._id, title);
	},

	'votes.remove': async function ({ voteId }: { voteId: string }) {
		/* This error occurs: https://github.com/meteor/meteor/issues/12283 
		..if this is simulated client-side, probably because soft-deleted 
		documents get unpublished */
		if (C.app.isClient) return;

		check(voteId, String);
		const user = await requireUser();

		if (C.app.isServer) {
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const sanitizer = require('/imports/startup/server/security/client-input-validation.ts');
			voteId = sanitizer.sanitizeInput(voteId, 'votes.remove', user._id);
		}

		return await votes.deleteVote(voteId, user._id);
	},

	'votes.updateDescription': async function ({
		voteId,
		description,
	}: {
		voteId: string;
		description: string;
	}) {
		check(voteId, String);
		check(description, String);
		const user = await requireUser();

		if (C.app.isServer) {
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const sanitizer = require('/imports/startup/server/security/client-input-validation.ts');
			voteId = sanitizer.sanitizeInput(voteId, 'votes.updateDescription', user._id);
			description = sanitizer.sanitizeInput(description, 'votes.updateDescription', user._id);
		}

		return await votes.updateVoteDescription(voteId, user._id, description);
	},

	'votes.updateTitle': async function ({ voteId, title }: { voteId: string; title: string }) {
		check(voteId, String);
		check(title, String);
		const user = await requireUser();

		if (C.app.isServer) {
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const sanitizer = require('/imports/startup/server/security/client-input-validation.ts');
			voteId = sanitizer.sanitizeInput(voteId, 'votes.updateTitle', user._id);
			title = sanitizer.sanitizeInput(title, 'votes.updateTitle', user._id);
		}

		return await votes.updateVoteTitle(voteId, user._id, title);
	},

	'votes.updateDurationInMinutes': async function ({
		voteId,
		durationInMinutes,
	}: {
		voteId: string;
		durationInMinutes: number;
	}) {
		check(voteId, String);
		check(durationInMinutes, Number);
		const user = await requireUser();

		if (C.app.isServer) {
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const sanitizer = require('/imports/startup/server/security/client-input-validation.ts');
			voteId = sanitizer.sanitizeInput(voteId, 'votes.updateDurationInMinutes', user._id);
			durationInMinutes = sanitizer.sanitizeInput(
				durationInMinutes,
				'votes.updateDurationInMinutes',
				user._id
			);
		}

		return await votes.updateVoteDurationInMinutes(voteId, user._id, durationInMinutes);
	},

	'votes.updateOptions': async function ({
		voteId,
		options,
	}: {
		voteId: string;
		options: string[];
	}) {
		check(voteId, String);
		check(options, Array);
		const user = await requireUser();

		if (C.app.isServer) {
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const sanitizer = require('/imports/startup/server/security/client-input-validation.ts');
			voteId = sanitizer.sanitizeInput(voteId, 'votes.updateOptions', user._id);
			options = sanitizer.sanitizeInput(options, 'votes.updateOptions', user._id);
		}

		return await votes.updateVoteOptions(voteId, user._id, options);
	},

	'votes.updateVoters': async function ({
		voteId,
		voters,
	}: {
		voteId: string;
		voters: string[];
	}) {
		check(voteId, String);
		check(voters, Array);
		const user = await requireUser();

		if (C.app.isServer) {
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const sanitizer = require('/imports/startup/server/security/client-input-validation.ts');
			voteId = sanitizer.sanitizeInput(voteId, 'votes.updateVoters', user._id);
			voters = sanitizer.sanitizeInput(voters, 'votes.updateVoters', user._id);
		}

		return await votes.updateVoteVoters(voteId, user._id, voters);
	},

	'votes.launch': async function ({ voteId }: { voteId: string }) {
		check(voteId, String);
		const user = await requireUser();

		if (C.app.isServer) {
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const sanitizer = require('/imports/startup/server/security/client-input-validation.ts');
			voteId = sanitizer.sanitizeInput(voteId, 'votes.launch', user._id);
		}

		return await votes.launchVote(voteId, user._id);
	},

	'votes.vote': async function ({
		voteId,
		optionIndex,
	}: {
		voteId: string;
		optionIndex: string;
	}) {
		check(voteId, String);
		check(optionIndex, String);
		const user = await requireUser();

		if (C.app.isServer) {
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const sanitizer = require('/imports/startup/server/security/client-input-validation.ts');
			voteId = sanitizer.sanitizeInput(voteId, 'votes.vote', user._id);
			optionIndex = sanitizer.sanitizeInput(optionIndex, 'votes.vote', user._id);
		}

		return await votes.vote(voteId, user._id, optionIndex);
	},

	'votes.getVoteState': async function ({ voteId, userId }: { voteId: string; userId: string }) {
		check(voteId, String);
		check(userId, String);
		const user = await requireUser();

		if (C.app.isServer) {
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const sanitizer = require('/imports/startup/server/security/client-input-validation.ts');
			voteId = sanitizer.sanitizeInput(voteId, 'votes.getVoteState', user._id);
			userId = sanitizer.sanitizeInput(userId, 'votes.getVoteState', user._id);
		}

		return await votes.getVoteState({ voteId, userId: user._id });
	},
});
