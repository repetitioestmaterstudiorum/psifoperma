import { Mongo } from 'meteor/mongo';
import { WithOptionalMetaFields, WithMetaFields } from '/imports/api/db/db.generic-functions';
import { C } from '/imports/startup/global.constants';

// ---

export const VotesCollection = new Mongo.Collection<VoteMetaOptional, VoteMeta>('votes');

export type Vote = {
	userId: string;
	title: string;
	description: string;
	status: keyof typeof C.votes.statuses;
	durationInMinutes: number;
	options: string[];
	voters: string[];
	// Once launched on the blockchain
	instanceId?: string;
	deadline?: number; // UNIX timestamp in seconds from smart contract
	deadlineJSDate?: Date;
	ownerAddress?: string;
	transactionHash?: string;
	votes?: {
		[voterAddress: string]: {
			optionIndex: number;
			transactionHash: string;
		};
	};
};
export type VoteMeta = WithMetaFields<Vote>;
export type VoteMetaOptional = WithOptionalMetaFields<Vote>;

if (C.app.isServer) {
	VotesCollection.createIndexAsync({ userId: 1 });
}
