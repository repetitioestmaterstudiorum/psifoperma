import { Meteor } from 'meteor/meteor';
import * as bc from '/imports/startup/server/blockchain/bc.logic';

// ---

Meteor.methods({
	'blockchain.createWallet': function () {
		return bc.createWallet();
	},

	'blockchain.createVoting': async function ({
		voterAddresses,
		proposalTitles,
		durationInMinutes,
	}: {
		voterAddresses: string[];
		proposalTitles: string[];
		durationInMinutes: number;
	}) {
		return await bc.createVoting(voterAddresses, proposalTitles, durationInMinutes);
	},

	'blockchain.vote': async function ({
		instanceId,
		proposalId,
		voterAddress,
	}: {
		instanceId: number;
		proposalId: number;
		voterAddress: string;
	}) {
		return await bc.vote(instanceId, proposalId, voterAddress);
	},

	'blockchain.getInstance': async function ({ instanceId }: { instanceId: number }) {
		return await bc.getInstance(instanceId);
	},

	'blockchain.getInstanceProposal': async function ({
		instanceId,
		proposalId,
	}: {
		instanceId: number;
		proposalId: number;
	}) {
		return await bc.getInstanceProposal(instanceId, proposalId);
	},

	'blockchain.getInstanceVoter': async function ({
		instanceId,
		voterAddress,
	}: {
		instanceId: number;
		voterAddress: string;
	}) {
		return await bc.getInstanceVoter(instanceId, voterAddress);
	},

	'blockchain.getInstancesCount': async function () {
		return await bc.getInstancesCount();
	},
});
