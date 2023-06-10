import { Meteor } from 'meteor/meteor';
import _ from 'lodash';
import { decrypt } from '/imports/startup/server/encryption/encryption';
import { C } from '/imports/startup/server/server.constants';
import { _defaultSettings } from '/imports/startup/server/settings/default-settings';
import { getMemoizedSetting } from '/imports/startup/server/settings/settings.model';
import { getErrMsg } from '/imports/utils/error-utils';
import { log } from '/imports/utils/logger';
import { findVotes, updateVoteStatus } from '/imports/api/collections/votes/votes.model';

// ---

Meteor.startup(async () => {
	if (C.app.isDev && !C.app.isProdSimulation) {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const ganache = require('ganache');

		const server = ganache.server(C.blockchain.ganacheOptions);

		server.listen(C.blockchain.ganachePort, (err: unknown) => {
			if (err) throw err;
			log.info(`ganache listening on port ${C.blockchain.ganachePort}...`);
		});

		await deployContract();

		await createAllVotings();
	}
});

async function deployContract() {
	try {
		const abi = await getMemoizedSetting('blockchain.abi', 30);
		const bytecode = await getMemoizedSetting('blockchain.bytecode', 30);

		// Directly from _defaultSettings because when we use the local chain, we don't want the value from the db
		const systemPkEncrypted = _defaultSettings.blockchain.systemPk;
		const systemPk = decrypt(systemPkEncrypted);

		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const Web3 = require('web3');
		const web3 = new Web3(C.blockchain.networkAddress);

		const signer = web3.eth.accounts.privateKeyToAccount(systemPk);

		const contract = new web3.eth.Contract(abi);

		const deployTx = contract.deploy({ data: bytecode });

		const gasEstimate = await deployTx.estimateGas();
		const gasPrice = await web3.eth.getGasPrice();

		const gasEstimateMultiplier = await getMemoizedSetting(
			'blockchain.gasEstimateMultiplier',
			30
		);
		const signed = await web3.eth.accounts.signTransaction(
			{
				data: deployTx.encodeABI(),
				from: signer.address,
				gas: Math.round(gasEstimate * gasEstimateMultiplier),
				gasPrice: gasPrice,
			},
			systemPk
		);
		if (!signed.rawTransaction) {
			log.error(
				// prettier-ignore
				`deployContract(): signed.rawTransaction is undefined. signed: ${JSON.stringify(signed, null, 2)}`
			);
			return;
		}

		const receipt = await web3.eth
			.sendSignedTransaction(signed.rawTransaction)
			.once('transactionHash', (txhash: string) => {
				log.info(`Mining deployment transaction ... txhash: ${txhash}`);
			});

		log.info(`Contract deployed at ${receipt.contractAddress}`);

		return receipt.contractAddress;
	} catch (error) {
		const errorMessage = getErrMsg(error);
		log.error(`deployContract(): error: ${errorMessage}`);
		throw new Meteor.Error(`deployContract(): error: ${errorMessage}`);
	}
}

async function createAllVotings() {
	if (!C.app.isDev) throw new Error('createAllVotings(): not in dev mode');

	// Checks are already done, we reset votes
	findVotes({ status: C.votes.statuses.active }, { sort: { createdAt: 1 } }).forEachAsync(
		async vote => {
			await updateVoteStatus(vote._id, vote.userId, C.votes.statuses.draft);
		}
	);
}
