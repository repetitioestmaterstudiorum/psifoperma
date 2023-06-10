import Web3 from 'web3';
import { C } from '/imports/startup/server/server.constants';
import { log } from '/imports/utils/logger';
import { Meteor } from 'meteor/meteor';
import { getErrMsg } from '/imports/utils/error-utils';
import { getMemoizedSetting } from '/imports/startup/server/settings/settings.model';
import { decrypt, encrypt } from '/imports/startup/server/encryption/encryption';
import _ from 'lodash';

// ---

Meteor.startup(() => {
	log.info(`Blockchain network starts with: ${C.blockchain.networkAddress.slice(0, 37)}...`);
});

export function createWallet() {
	log.info(`createWallet()`);
	const web3 = new Web3(C.blockchain.networkAddress);
	const { address, privateKey } = web3.eth.accounts.create();
	log.info(`createWallet(): address: ${address}`);
	const encryptedPk = encrypt(privateKey);
	return { address, privateKey: encryptedPk };
}

export async function createVoting(
	voterAddresses: string[],
	proposalTitles: string[],
	durationInMinutes: number
) {
	try {
		log.info(
			`createVoting(): voterAddresses: ${voterAddresses}, proposalTitles: ${proposalTitles}, durationInMinutes: ${durationInMinutes}`
		);

		if (voterAddresses.length > C.blockchain.limits.voterAddresses) {
			log.error(
				`deployContract(): voterAddresses.length (${voterAddresses.length}) > C.blockchain.limits.voterAddresses (${C.blockchain.limits.voterAddresses})`
			);
			return;
		}
		if (proposalTitles.length > C.blockchain.limits.numProposals) {
			log.error(
				`deployContract(): proposals.length (${proposalTitles.length}) > C.blockchain.limits.numProposals (${C.blockchain.limits.numProposals})`
			);
			return;
		}
		if (durationInMinutes > C.blockchain.limits.durationInMinutes) {
			log.error(
				`deployContract(): durationInMinutes (${durationInMinutes}) < C.blockchain.limits.durationInMinutes (${C.blockchain.limits.durationInMinutes})`
			);
			return;
		}

		const web3 = new Web3(C.blockchain.networkAddress);
		const abi = await getMemoizedSetting('blockchain.abi', 30);
		const contractAddress = await getMemoizedSetting('blockchain.contractAddress', 30);
		const systemPkEncrypted = await getMemoizedSetting('blockchain.systemPk', 30);
		const systemPk = decrypt(systemPkEncrypted);

		const account = web3.eth.accounts.privateKeyToAccount(systemPk);
		web3.eth.accounts.wallet.add(account);
		web3.eth.defaultAccount = account.address;

		const contract = new web3.eth.Contract(abi, contractAddress);

		const gasEstimate = await contract.methods
			.createVoting(voterAddresses, proposalTitles, durationInMinutes)
			.estimateGas({ from: account.address });

		const gasEstimateMultiplier = await getMemoizedSetting(
			'blockchain.gasEstimateMultiplier',
			30
		);
		const result = await contract.methods
			.createVoting(voterAddresses, proposalTitles, durationInMinutes)
			.send({
				from: account.address,
				gas: Math.round(gasEstimate * gasEstimateMultiplier),
			});

		if (C.app.isDev) {
			// This is a hack to get the instanceId (and other values) in dev mode because ganache (and hardhat) don't emit events
			const { instancesCount } = await getInstancesCount();
			const instanceId = instancesCount - 1;
			const transactionHash = result.transactionHash;
			const deadline = Math.round(Date.now() / 1000) + durationInMinutes * 60;
			const deadlineJSDate = new Date(deadline * 1000);
			const ownerAddress = account.address;
			log.info(
				`createVoting(): instanceId: ${instanceId} created. transactionHash: ${transactionHash}, deadline: ${deadline}, deadlineJSDate: ${deadlineJSDate}, ownerAddress: ${ownerAddress}`
			);
			return { instanceId, deadline, deadlineJSDate, ownerAddress, transactionHash };
		}

		if (!result.events.RETcreateVoting) {
			throw new Meteor.Error(`Voting deployment returned no events`);
		}
		const instanceId = _.toNumber(result.events.RETcreateVoting.returnValues.instanceId);
		const deadline = result.events.RETcreateVoting.returnValues.deadline;
		const deadlineJSDate = new Date(deadline * 1000);
		const ownerAddress = result.events.RETcreateVoting.returnValues.ownerAddress;
		const transactionHash = result.transactionHash;
		log.info(
			`createVoting(): instanceId: ${instanceId} created. transactionHash: ${transactionHash}, deadline: ${deadline}, deadlineJSDate: ${deadlineJSDate}, ownerAddress: ${ownerAddress}`
		);
		return { instanceId, deadline, deadlineJSDate, ownerAddress, transactionHash };
	} catch (error) {
		const errorMessage = getErrMsg(error);
		log.error(`createVoting(): error: ${errorMessage}`);
		throw new Meteor.Error(`createVoting(): error: ${errorMessage}`);
	}
}

export async function vote(instanceId: number, proposalId: number, voterAddress: string) {
	try {
		log.info(
			`vote(): instanceId: ${instanceId}, proposalId: ${proposalId}, voterAddress: ${voterAddress}`
		);

		const abi = await getMemoizedSetting('blockchain.abi', 30);
		const contractAddress = await getMemoizedSetting('blockchain.contractAddress', 30);
		const systemPkEncrypted = await getMemoizedSetting('blockchain.systemPk', 30);
		const systemPk = decrypt(systemPkEncrypted);

		const web3 = new Web3(C.blockchain.networkAddress);

		const contract = new web3.eth.Contract(abi, contractAddress);
		const account = web3.eth.accounts.privateKeyToAccount(systemPk);
		web3.eth.accounts.wallet.add(account);
		web3.eth.defaultAccount = account.address;

		const gasEstimate = await contract.methods
			.vote(instanceId, proposalId, voterAddress)
			.estimateGas({ from: account.address });

		const gasEstimateMultiplier = await getMemoizedSetting(
			'blockchain.gasEstimateMultiplier',
			30
		);
		const result = await contract.methods.vote(instanceId, proposalId, voterAddress).send({
			from: account.address,
			gas: Math.round(gasEstimate * gasEstimateMultiplier),
		});

		const transactionHash = result.transactionHash;
		log.info(
			`vote(): instanceId: ${instanceId}, proposalId: ${proposalId}, transactionHash: ${transactionHash}`
		);
		return { transactionHash };
	} catch (error) {
		const errorMessage = getErrMsg(error);
		log.error(`vote(): error: ${errorMessage}`);
		throw new Meteor.Error(`vote(): error: ${errorMessage}`);
	}
}

export async function getInstance(instanceId: number) {
	try {
		log.info(`getInstance(): instanceId: ${instanceId}`);

		const abi = await getMemoizedSetting('blockchain.abi', 30);
		const contractAddress = await getMemoizedSetting('blockchain.contractAddress', 30);
		const web3 = new Web3(C.blockchain.networkAddress);

		const contract = new web3.eth.Contract(abi, contractAddress);

		const result = await contract.methods.getInstance(instanceId).call();

		const proposalCount = result[0];
		const deadline = result[1];
		const deadlineJSDate = new Date(deadline * 1000);
		const ownerAddress = result[2];
		const isClosed = new Date() > deadlineJSDate;
		log.info(
			`getInstance(): instanceId: ${instanceId}, proposalCount: ${proposalCount}, deadline: ${deadline}, deadlineJSDate: ${deadlineJSDate}, ownerAddress: ${ownerAddress}, isClosed: ${isClosed}`
		);
		return { proposalCount, deadline, deadlineJSDate, ownerAddress, isClosed };
	} catch (error) {
		const errorMessage = getErrMsg(error);
		log.error(`getInstance(): error: ${errorMessage}`);
		throw new Meteor.Error(`getInstance(): error: ${errorMessage}`);
	}
}

export async function getInstanceProposal(instanceId: number, proposalId: number) {
	try {
		log.info(`getInstanceProposal(): instanceId: ${instanceId}, proposalId: ${proposalId}`);

		const abi = await getMemoizedSetting('blockchain.abi', 30);
		const contractAddress = await getMemoizedSetting('blockchain.contractAddress', 30);
		const web3 = new Web3(C.blockchain.networkAddress);

		const contract = new web3.eth.Contract(abi, contractAddress);

		const result = await contract.methods.getInstanceProposal(instanceId, proposalId).call();

		const voteCount = result[0];
		const title = result[1];
		log.info(
			`getInstanceProposal(): instanceId: ${instanceId}, proposalId: ${proposalId}, voteCount: ${voteCount}, title: ${title}`
		);
		return { voteCount, title };
	} catch (error) {
		let errorMessage = getErrMsg(error);
		if (errorMessage === "Cannot read property 'length' of undefined") {
			errorMessage = 'This voting has no proposals';
		}
		log.error(`getInstanceProposal(): error: ${errorMessage}`);
		throw new Meteor.Error(`getInstanceProposal(): error: ${errorMessage}`);
	}
}

export async function getInstanceVoter(instanceId: number, voterAddress: string) {
	try {
		log.info(`getInstanceVoter(): instanceId: ${instanceId}, voterAddress: ${voterAddress}`);

		const abi = await getMemoizedSetting('blockchain.abi', 30);
		const contractAddress = await getMemoizedSetting('blockchain.contractAddress', 30);
		const web3 = new Web3(C.blockchain.networkAddress);

		const contract = new web3.eth.Contract(abi, contractAddress);

		const result = await contract.methods.getInstanceVoter(instanceId, voterAddress).call();

		const isVoter = result[0];
		const hasVoted = result[1];
		const vote = result[2];
		log.info(
			`getInstanceVoter(): instanceId: ${instanceId}, voterAddress: ${voterAddress}, isVoter: ${isVoter}, hasVoted: ${hasVoted}, vote: ${vote}`
		);
		return { isVoter, hasVoted, vote };
	} catch (error) {
		const errorMessage = getErrMsg(error);
		log.error(`getInstanceVoter(): error: ${errorMessage}`);
		throw new Meteor.Error(`getInstanceVoter(): error: ${errorMessage}`);
	}
}

export async function getInstancesCount() {
	try {
		log.info(`getInstancesCount()`);

		const abi = await getMemoizedSetting('blockchain.abi', 30);
		const contractAddress = await getMemoizedSetting('blockchain.contractAddress', 30);
		const web3 = new Web3(C.blockchain.networkAddress);

		const contract = new web3.eth.Contract(abi, contractAddress);

		const result = await contract.methods.getInstancesCount().call();

		const instancesCount = _.toNumber(result);
		log.info(`getInstancesCount(): instancesCount: ${instancesCount}`);
		return { instancesCount };
	} catch (error) {
		const errorMessage = getErrMsg(error);
		log.error(`getInstancesCount(): error: ${errorMessage}`);
		throw new Meteor.Error(`getInstancesCount(): error: ${errorMessage}`);
	}
}
