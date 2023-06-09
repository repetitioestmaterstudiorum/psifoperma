import Web3 from 'web3';
import { getSetting } from '/imports/startup/server/settings/settings.model';
import { C } from '/imports/startup/server/server.constants';
import { Meteor } from 'meteor/meteor';

// ---

const web3 = new Web3(C.blockchain.networkAddress);
const abi = await getSetting('blockchain.abi');
const contractAddress = await getSetting('blockchain.contractAddress');

const contract = new web3.eth.Contract(abi, contractAddress);
const ownerAddress = '0x28eeC628CF8A90Cd3631706CB7F41445Cb11fc80'; // local dev. network

async function calculateGas() {
	const functions = abi.filter((item: any) => item.type === 'function');

	let votingInstanceId = 0;
	for (const func of functions) {
		const funcName = func.name;

		let estimate = 0;
		try {
			if (funcName === 'createVoting') {
				// @ts-ignore
				const receipt = await contract.methods[funcName](...argDict[funcName]).send({
					from: ownerAddress,
					gas: 5000000,
				});
				votingInstanceId = receipt.events.RETcreateVoting.returnValues.instanceId;
				estimate = receipt.gasUsed;
			} else if (funcName === 'vote') {
				//
				const receipt = await contract.methods[funcName](
					votingInstanceId,
					0,
					ownerAddress
				).send({ from: ownerAddress, gas: 5000000 });
				estimate = receipt.gasUsed;
			} else {
				// mock
				estimate = await web3.eth.estimateGas({
					to: contractAddress,
					from: ownerAddress,
					// @ts-ignore
					data: contract.methods[funcName](...argDict[funcName]).encodeABI(),
				});
			}

			console.log(`Estimated gas for function ${funcName}: ${estimate}`);
		} catch (error) {
			console.log(
				// @ts-ignore
				`Cannot estimate gas for function ${funcName} due to error: ${error.message}`
			);
		}
	}
}

const argDict = {
	createVoting: [new Array(10).fill(ownerAddress), new Array(10).fill('Proposal Title'), 10],
	getInstance: [0],
	getInstanceProposal: [0, 0],
	getInstanceVoter: [0, ownerAddress],
	getInstancesCount: [],
};

if (C.app.isDev) {
	Meteor.methods({
		'bc.calculateGas': calculateGas,
	});
}
