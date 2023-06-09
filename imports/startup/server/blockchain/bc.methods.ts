import { Meteor } from 'meteor/meteor';
import * as bc from '/imports/startup/server/blockchain/bc.logic';

// ---

Meteor.methods({
	'blockchain.createWallet': () => {
		return bc.createWallet();
	},

	'blockchain.createVoting': async ({
		voterAddresses,
		proposalTitles,
		durationInMinutes,
	}: {
		voterAddresses: string[];
		proposalTitles: string[];
		durationInMinutes: number;
	}) => {
		return await bc.createVoting(voterAddresses, proposalTitles, durationInMinutes);
	},

	'blockchain.vote': async ({
		instanceId,
		proposalId,
		voterAddress,
	}: {
		instanceId: number;
		proposalId: number;
		voterAddress: string;
	}) => {
		return await bc.vote(instanceId, proposalId, voterAddress);
	},

	'blockchain.getInstance': async ({ instanceId }: { instanceId: number }) => {
		return await bc.getInstance(instanceId);
	},

	'blockchain.getInstanceProposal': async ({
		instanceId,
		proposalId,
	}: {
		instanceId: number;
		proposalId: number;
	}) => {
		return await bc.getInstanceProposal(instanceId, proposalId);
	},

	'blockchain.getInstanceVoter': async ({
		instanceId,
		voterAddress,
	}: {
		instanceId: number;
		voterAddress: string;
	}) => {
		return await bc.getInstanceVoter(instanceId, voterAddress);
	},

	'blockchain.getInstancesCount': async () => {
		return await bc.getInstancesCount();
	},
});
