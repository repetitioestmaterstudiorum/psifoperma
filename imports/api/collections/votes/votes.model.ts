import { Meteor } from 'meteor/meteor';
import { Vote, VoteMeta, VotesCollection } from './votes.collection';
import { getIsAdmin } from '/imports/api/collections/roles/roles.model';
import {
	addUserByEmailPWL,
	getFirstEmailOrUsername,
	getUserByEmail,
	getUserById,
} from '/imports/api/collections/users/users.model';
import {
	insert,
	update,
	remove,
	find,
	MeteorMongoSelector,
	FindOptions,
	UpdateModifier,
} from '/imports/api/db/db.generic-functions';
import { C } from '/imports/startup/global.constants';
import { getErrMsg } from '/imports/utils/error-utils';
import { log } from '/imports/utils/logger';

// ---

// @ts-ignore
export async function getVoteState({
	voteId,
	userId,
	retriesLeft = 3,
}: {
	voteId: string;
	userId: string;
	retriesLeft?: number;
}) {
	/* Required functionality:
	- vote still ongoing? -> isClosed and proposalCount from bc.getInstance()
	- votes per proposal -> loop through proposalCount and get bc.getInstanceProposal() to get voteCount and title
	(- winning proposal -> client-side logic)
	- if isClosed, change vote state in db to closed */
	if (C.app.isServer) {
		const { vote } = await requireVoteReadRights({ voteId, userId });

		if (!vote?.instanceId && !(vote?.instanceId === 0)) {
			const errorMessage = `getVoteState(): no instanceId on vote ${voteId}, can't get stats! (in prod). Should habe been deployed. Retries left: ${retriesLeft}, retrying in 5 seconds ...`;
			log.error(errorMessage);
			if (retriesLeft === 0) {
				throw new Meteor.Error(`Failed to get vote status for vote ${voteId}`);
			}
			await new Promise(resolve => setTimeout(resolve, 5000));
			return getVoteState({ voteId, userId, retriesLeft: retriesLeft - 1 });
		}

		// eslint-disable-next-line
		const bc = require('/imports/startup/server/blockchain/bc.logic.ts');

		const { proposalCount, isClosed } = await bc.getInstance(vote.instanceId);

		if (isClosed && !(vote.status === C.votes.statuses.completed)) {
			log.info(
				`getVoteState(): voteId: ${voteId}, isClosed: ${isClosed}, updating status ...`
			);
			await updateVoteStatus(voteId, userId, C.votes.statuses.completed);
		}

		const proposals = await Promise.all(
			Array.from({ length: proposalCount }, async (_undef, idx) => {
				const { voteCount, title } = await bc.getInstanceProposal(vote.instanceId, idx);
				return { voteCount, title };
			})
		);

		return { proposals, isClosed };
	}
}

export async function vote(voteId: string, userId: string, optionIndex: string) {
	const vote = await findOneVote({ _id: voteId });
	if (!vote) {
		const errorMessag = `vote(): vote not found: ${voteId}`;
		log.error(errorMessag);
		throw new Meteor.Error(errorMessag);
	}

	const user = await getUserById(userId);
	if (!user) {
		const errorMessag = `vote(): user not found: ${userId}`;
		log.error(errorMessag);
		throw new Meteor.Error(errorMessag);
	}

	const voterAddress = user?.profile?.bcAddress;
	if (!voterAddress) {
		const errorMessag = `vote(): voterAddress not found: ${userId}`;
		log.error(errorMessag);
		throw new Meteor.Error(errorMessag);
	}

	if (!optionIndex) {
		const errorMessage = `vote(): optionIndex not found: ${optionIndex}`;
		log.error(errorMessage);
		throw new Meteor.Error(errorMessage);
	}

	if (C.app.isServer) {
		// eslint-disable-next-line
		const bc = require('/imports/startup/server/blockchain/bc.logic.ts');
		const { transactionHash } = await bc.vote(vote.instanceId, optionIndex, voterAddress);

		return await updateVote({ _id: voteId }, userId, {
			$set: {
				[`votes.${voterAddress}`]: {
					optionIndex,
					transactionHash,
				},
			},
		});
	}

	return await updateVote({ _id: voteId }, userId, { $addToSet: { voters: userId } });
}

export async function launchVote(voteId: string, userId: string) {
	await requireVoteUserOwnership({ voteId, userId });

	if (C.app.isServer) {
		const vote = await findOneVote({ _id: voteId });
		if (!vote) {
			const errorMessag = `launchVote(): vote not found: ${voteId}`;
			log.error(errorMessag);
			throw new Meteor.Error(errorMessag);
		}

		const voterBcAddresses = (
			await Promise.all(
				vote.voters.map(async voterEmail => {
					try {
						await inviteVoter(voteId, voterEmail, vote.title);
						const user = await getUserByEmail(voterEmail);
						if (!user) {
							const errorMessage = `launchVote(): user not found: ${voterEmail}`;
							log.error(errorMessage);
							throw new Meteor.Error(errorMessage);
						}
						return user?.profile?.bcAddress;
					} catch (error) {
						const errMsg = getErrMsg(error);
						log.error(`launchVote(): ${errMsg}`, error);
						throw new Meteor.Error(errMsg);
					}
				})
			)
		).filter(Boolean);

		if (voterBcAddresses.length === 0) {
			const errorMessage = `launchVote(): voterBcAddresses.length === 0`;
			log.error(errorMessage);
			throw new Meteor.Error(errorMessage);
		}
		if (vote.options.length === 0) {
			const errorMessage = `launchVote(): vote.options.length === 0`;
			log.error(errorMessage);
			throw new Meteor.Error(errorMessage);
		}
		if (!vote.durationInMinutes || vote.durationInMinutes < 1) {
			const errorMessage = `launchVote(): vote.durationInMinutes < 1`;
			log.error(errorMessage);
			throw new Meteor.Error(errorMessage);
		}

		// eslint-disable-next-line
		const bc = require('/imports/startup/server/blockchain/bc.logic.ts');
		const { instanceId, deadline, deadlineJSDate, ownerAddress, transactionHash } =
			await bc.createVoting(voterBcAddresses, vote.options, vote.durationInMinutes);

		await updateVote({ _id: voteId }, userId, {
			$set: {
				instanceId,
				deadline,
				deadlineJSDate,
				ownerAddress,
				transactionHash,
			},
		});

		const user = await getUserById(userId);
		const userEmail = user ? getFirstEmailOrUsername(user) : 'unknown';
		// eslint-disable-next-line
		const serverC = require('/imports/startup/server/server.constants.ts').C;
		// eslint-disable-next-line
		const sendEmail = require('/imports/startup/server/email/email.ts').sendEmail;
		sendEmail({
			to: serverC.seeds.admin.email,
			subject: 'New vote launched',
			text: `New vote launched: ${vote.title} by ${userEmail}.\nOptions: ${vote.options.join(
				', '
			)}\nDuration: ${vote.durationInMinutes} minutes.`,
		});
	}

	return await updateVoteStatus(voteId, userId, C.votes.statuses.active);
}

export async function updateVoteDurationInMinutes(
	voteId: string,
	userId: string,
	durationInMinutes: number
) {
	await requireVoteUserOwnership({ voteId, userId });

	return await updateVote({ _id: voteId }, userId, { $set: { durationInMinutes } });
}

export async function updateVoteOptions(voteId: string, userId: string, options: string[]) {
	// Note: in case this list gets really long, should use $addToSet and $pull instead

	await requireVoteUserOwnership({ voteId, userId });

	return await updateVote({ _id: voteId }, userId, { $set: { options } });
}

export async function updateVoteVoters(voteId: string, userId: string, voters: string[]) {
	// Note: in case this list gets really long, should use $addToSet and $pull instead

	await requireVoteUserOwnership({ voteId, userId });

	return await updateVote({ _id: voteId }, userId, { $set: { voters } });
}

export async function updateVoteTitle(voteId: string, userId: string, title: string) {
	await requireVoteUserOwnership({ voteId, userId });

	return await updateVote({ _id: voteId }, userId, { $set: { title } });
}

export async function updateVoteDescription(voteId: string, userId: string, description: string) {
	await requireVoteUserOwnership({ voteId, userId });

	return await updateVote({ _id: voteId }, userId, { $set: { description } });
}

async function inviteVoter(voteId: string, voterEmail: string, voteTitle: string) {
	const voter = await getUserByEmail(voterEmail);

	const voterId = voter ? voter._id : await addUserByEmailPWL(voterEmail, [C.roles.voter]);

	if (!voterId) {
		const errorMessage = `inviteVoter(): voterId not found: ${voterEmail} (and could not create)`;
		log.error(errorMessage);
		throw new Meteor.Error(errorMessage);
	}

	if (C.app.isServer) {
		// eslint-disable-next-line
		const sendEmail = require('/imports/startup/server/email/email.ts').sendEmail;
		return await sendEmail({
			to: voterEmail,
			subject: 'You have been invited to vote!',
			text: `Hello, you have been invited to vote! 

The vote you have been invited to: ${voteTitle}

Link to the vote: ${Meteor.absoluteUrl('vote/' + voteId)}`,
		});
	}
}

export async function addVote(userId: string, title: string) {
	return await insertVote(userId, title);
}

export async function getVotes(userId: string) {
	return await findVotes({ userId });
}

export async function deleteVote(voteId: string, userId: string) {
	await requireVoteUserOwnership({ voteId, userId });

	return await removeVote({ _id: voteId }, userId);
}

export async function updateVoteStatus(voteId: string, userId: string, status: string) {
	if (!Object.values(C.votes.statuses).includes(status)) {
		const errorMessage = `updateVoteStatus(): invalid status: ${status}`;
		log.error(errorMessage);
		throw new Meteor.Error(errorMessage);
	}

	return await updateVote({ _id: voteId }, userId, {
		$set: { status: status as Vote['status'] },
	});
}

// helpers ---------------------------------------------------------------------

async function requireVoteUserOwnership({ voteId, userId }: { voteId: string; userId: string }) {
	const vote = await VotesCollection.findOneAsync({ _id: voteId, userId });
	if (!vote) {
		throw new Meteor.Error('Access denied.');
	}
	return vote;
}

async function requireVoteReadRights({ voteId, userId }: { voteId: string; userId: string }) {
	const user = await getUserById(userId);
	if (!user) {
		log.error(
			`requireVoteReadRights(): user not found: ${userId}. Sent "Access denied." error.`
		);
		throw new Meteor.Error('Access denied.');
	}

	const isAdmin = getIsAdmin(user._id);

	if (isAdmin) {
		const vote = await findOneVote({ _id: voteId });
		if (!vote) {
			log.error(
				`requireVoteReadRights(): user not found: ${userId}. Sent "Access denied." error.`
			);
			throw new Meteor.Error('Access denied.');
		}
		return { vote, user };
	}

	const vote = await findOneVote({
		_id: voteId,
		$or: [{ userId: user._id }, { voters: user.emails?.[0]?.address }],
	});
	if (!vote) {
		throw new Meteor.Error('Access denied.');
	}

	return { vote, user };
}

// CRUD ------------------------------------------------------------------------

async function insertVote(userId: VoteMeta['userId'], title: VoteMeta['title']) {
	return await insert(VotesCollection, {
		userId,
		title,
		description: '',
		status: 'draft',
		durationInMinutes: 1,
		options: [],
		voters: [],
	});
}

async function updateVote(
	selector: MeteorMongoSelector<Vote>,
	userId: VoteMeta['userId'],
	modifier: UpdateModifier<Vote>
) {
	return await update(VotesCollection, selector, modifier, userId);
}

async function removeVote(selector: MeteorMongoSelector<Vote>, userId: VoteMeta['userId']) {
	return await remove(VotesCollection, selector, userId);
}

export function findVotes(selector: MeteorMongoSelector<Vote>, options: FindOptions = {}) {
	return find(VotesCollection, selector, options);
}

export async function findOneVote(selector: MeteorMongoSelector<Vote>, options: FindOptions = {}) {
	return await VotesCollection.findOneAsync(selector, options);
}
