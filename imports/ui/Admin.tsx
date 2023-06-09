import { Meteor } from 'meteor/meteor';
import React, { useState } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { UserMeta } from '/imports/api/collections/users/users.collection';
import { findUsers, getFirstEmailOrUsername } from '/imports/api/collections/users/users.model';
import { getIsAdmin, getRolesForUser } from '/imports/api/collections/roles/roles.model';
import { Loading } from '/imports/ui/components/Loading';
import Swal from 'sweetalert2';
import { C } from '/imports/startup/client/client.constants';
import { logAndFireSwalError } from '/imports/ui/ui-utils/error.utils';
import _ from 'lodash';

// ---

export function Admin() {
	const { users, isLoading, isAdmin } = useTracker(() => {
		const user = Meteor.user() as UserMeta | null;

		const noData = {
			users: [],
			isAdmin: false,
			isLoading: false,
		};
		if (!user) return noData;

		const usersSubHandler = Meteor.subscribe('users');
		if (!usersSubHandler.ready()) {
			return { ...noData, isLoading: true };
		}

		const users = findUsers({}).fetch();

		const isAdmin = getIsAdmin(user._id);

		return { users, isAdmin, isLoading: false };
	});

	if (!isLoading && !Meteor.loggingIn() && !isAdmin) window.location.href = C.routes.home;

	return (
		<div className="mx-auto max-w-2xl px-4">
			<h1 className="text-xl font-bold mb-6">Admin Page</h1>
			{isLoading ? (
				<Loading />
			) : (
				<div>
					<h2 className="text-xl font-bold mb-2">Users:</h2>
					<table className="table w-full">
						<thead>
							<tr>
								<th>
									Email
									<br />
									(userId)
								</th>
								<th>Roles</th>
							</tr>
						</thead>
						<tbody>
							{users.map(user => (
								<tr key={user._id}>
									<td>
										{getFirstEmailOrUsername(user)}
										<br />({user._id})
									</td>
									<td className="flex flex-row space-x-2">
										<div>
											<span>
												{getRolesForUser(user._id).join(', ') || 'No roles'}
											</span>
											<br />
											<button
												className="btn btn-sm btn-outline"
												onClick={async () => {
													Swal.fire({
														title: 'Add user to role',
														input: 'text',
														showCancelButton: true,
														confirmButtonText: 'Add',
														showLoaderOnConfirm: true,
														preConfirm: async role => {
															await Meteor.callAsync(
																'users.addToRole',
																user._id,
																role
															);
														},
														allowOutsideClick: () => !Swal.isLoading(),
													})
														.then(result => {
															if (result.isConfirmed) {
																Swal.fire({
																	title: 'Added!',
																	text: `Added ${getFirstEmailOrUsername(
																		user
																	)} to role ${result.value}`,
																	icon: 'success',
																});
															}
														})
														.catch(error => {
															logAndFireSwalError(
																error,
																'addToRole()'
															);
														});
												}}
											>
												Add role
											</button>
											<button
												className="btn btn-sm btn-outline ml-2"
												onClick={async () => {
													try {
														await Meteor.callAsync(
															'users.createWalletForUser',
															user._id
														);
														Swal.fire({
															title: 'Wallet created',
															text: `Wallet created for ${getFirstEmailOrUsername(
																user
															)}`,
															icon: 'success',
														});
													} catch (error) {
														logAndFireSwalError(
															error,
															'users.createWalletForUser'
														);
													}
												}}
											>
												Add wallet
											</button>
											<button
												className="btn btn-sm btn-outline ml-2"
												onClick={() => {
													Swal.fire({
														title: 'User document',
														text: JSON.stringify(
															_.omit(user, 'services'),
															null,
															2
														),
														icon: 'info',
													});
												}}
											>
												Show
											</button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>

					<div className="w-full">
						<h3 className="text-l font-bold mt-5 mb-2">Blockchain</h3>
					</div>
					<BlockchainButtons />
				</div>
			)}
		</div>
	);
}

export default function BlockchainButtons() {
	const [votingInfo, setVotingInfo] = useState({
		voterAddresses: '',
		proposalTitles: '',
		durationInMinutes: '',
	});
	const [voteInfo, setVoteInfo] = useState({ instanceId: '', proposalId: '', voterAddress: '' });
	const [getInstanceId, setGetInstanceId] = useState('');
	const [proposalId, setProposalId] = useState('');
	const [voterAddress, setVoterAddress] = useState('');

	return (
		<div className="flex flex-col space-y-2">
			{/* Wallet Button */}
			<div>
				<button
					onClick={async () => {
						try {
							const result = await Meteor.callAsync('blockchain.createWallet');
							Swal.fire({
								title: 'Wallet created',
								text: `Contract address: ${JSON.stringify(result, null, 2)}`,
								icon: 'success',
							});
						} catch (error) {
							logAndFireSwalError(error, 'blockchain.createWallet');
						}
					}}
					className="btn btn-sm btn-outline mt-4"
				>
					Create wallet
				</button>
			</div>

			{/* Voting Button */}
			<div className="flex flex-row space-x-2">
				<input
					className="input border-1 border-gray-500 rounded input-sm text-left"
					value={votingInfo.voterAddresses}
					onChange={e => setVotingInfo({ ...votingInfo, voterAddresses: e.target.value })}
					placeholder="Addresses (comma-separated)"
				/>
				<input
					className="input border-1 border-gray-500 rounded input-sm text-left"
					value={votingInfo.proposalTitles}
					onChange={e => setVotingInfo({ ...votingInfo, proposalTitles: e.target.value })}
					placeholder="Proposals (comma-separated)"
				/>
				<input
					className="input border-1 border-gray-500 rounded input-sm text-left"
					value={votingInfo.durationInMinutes}
					onChange={e =>
						setVotingInfo({ ...votingInfo, durationInMinutes: e.target.value })
					}
					placeholder="Duration in Minutes"
				/>
				<button
					onClick={async () => {
						try {
							const { voterAddresses, proposalTitles, durationInMinutes } =
								votingInfo;
							const result = await Meteor.callAsync('blockchain.createVoting', {
								voterAddresses: voterAddresses.split(','),
								proposalTitles: proposalTitles.split(','),
								durationInMinutes: parseInt(durationInMinutes),
							});
							Swal.fire({
								title: 'Voting created',
								text: `Voting info: ${JSON.stringify(result, null, 2)}`,
								icon: 'success',
							});
						} catch (error) {
							logAndFireSwalError(error, 'blockchain.createVoting');
						}
					}}
					className="btn btn-sm btn-outline"
				>
					Create Voting
				</button>
			</div>

			{/* Vote Button */}
			<div className="flex flex-row space-x-2">
				<input
					className="input border-1 border-gray-500 rounded input-sm text-left"
					value={voteInfo.instanceId}
					onChange={e => setVoteInfo({ ...voteInfo, instanceId: e.target.value })}
					placeholder="Instance ID"
				/>
				<input
					className="input border-1 border-gray-500 rounded input-sm text-left"
					value={voteInfo.proposalId}
					onChange={e => setVoteInfo({ ...voteInfo, proposalId: e.target.value })}
					placeholder="Proposal ID"
				/>
				<input
					className="input border-1 border-gray-500 rounded input-sm text-left"
					value={voteInfo.voterAddress}
					onChange={e => setVoteInfo({ ...voteInfo, voterAddress: e.target.value })}
					placeholder="Voter Address"
				/>
				<button
					onClick={async () => {
						try {
							const { instanceId, proposalId, voterAddress } = voteInfo;
							const result = await Meteor.callAsync('blockchain.vote', {
								instanceId: parseInt(instanceId),
								proposalId: parseInt(proposalId),
								voterAddress: voterAddress,
							});
							Swal.fire({
								title: 'Voted!',
								text: `Vote receipt: ${JSON.stringify(result, null, 2)}`,
								icon: 'success',
							});
						} catch (error) {
							logAndFireSwalError(error, 'blockchain.vote');
						}
					}}
					className="btn btn-sm btn-outline"
				>
					Vote
				</button>
			</div>

			<div className="flex flex-row space-x-2">
				<input
					className="input border-1 border-gray-500 rounded input-sm text-left"
					value={getInstanceId}
					onChange={e => setGetInstanceId(e.target.value)}
					placeholder="Instance ID"
				/>
				<button
					onClick={async () => {
						try {
							const result = await Meteor.callAsync('blockchain.getInstance', {
								instanceId: parseInt(getInstanceId),
							});
							Swal.fire({
								title: 'Instance Info',
								text: `Instance info: ${JSON.stringify(result, null, 2)}`,
								icon: 'success',
							});
						} catch (error) {
							logAndFireSwalError(error, 'blockchain.getInstance');
						}
					}}
					className="btn btn-sm btn-outline"
				>
					Get Instance
				</button>
			</div>

			<div className="flex flex-row space-x-2">
				<input
					className="input border-1 border-gray-500 rounded input-sm text-left"
					value={getInstanceId}
					onChange={e => setGetInstanceId(e.target.value)}
					placeholder="Instance ID"
				/>
				<input
					className="input border-1 border-gray-500 rounded input-sm text-left"
					value={proposalId}
					onChange={e => setProposalId(e.target.value)}
					placeholder="Proposal ID"
				/>
				<button
					onClick={async () => {
						try {
							const result = await Meteor.callAsync(
								'blockchain.getInstanceProposal',
								{
									instanceId: parseInt(getInstanceId),
									proposalId: parseInt(proposalId),
								}
							);
							Swal.fire({
								title: 'Instance Proposal',
								text: `Proposal info: ${JSON.stringify(result, null, 2)}`,
								icon: 'success',
							});
						} catch (error) {
							logAndFireSwalError(error, 'blockchain.getInstanceProposal');
						}
					}}
					className="btn btn-sm btn-outline"
				>
					Get Instance Proposal
				</button>
			</div>

			<div className="flex flex-row space-x-2">
				<input
					className="input border-1 border-gray-500 rounded input-sm text-left"
					value={getInstanceId}
					onChange={e => setGetInstanceId(e.target.value)}
					placeholder="Instance ID"
				/>
				<input
					className="input border-1 border-gray-500 rounded input-sm text-left"
					value={voterAddress}
					onChange={e => setVoterAddress(e.target.value)}
					placeholder="Voter Address"
				/>
				<button
					onClick={async () => {
						try {
							const result = await Meteor.callAsync('blockchain.getInstanceVoter', {
								instanceId: parseInt(getInstanceId),
								voterAddress: voterAddress,
							});
							Swal.fire({
								title: 'Instance Voter',
								text: `Voter info: ${JSON.stringify(result, null, 2)}`,
								icon: 'success',
							});
						} catch (error) {
							logAndFireSwalError(error, 'blockchain.getInstanceVoter');
						}
					}}
					className="btn btn-sm btn-outline"
				>
					Get Instance Voter
				</button>
			</div>

			<div>
				<button
					onClick={async () => {
						try {
							const result = await Meteor.callAsync('blockchain.getInstancesCount');
							Swal.fire({
								title: 'Instances Count',
								text: `Count: ${JSON.stringify(result, null, 2)}`,
								icon: 'success',
							});
						} catch (error) {
							logAndFireSwalError(error, 'blockchain.getInstancesCount');
						}
					}}
					className="btn btn-sm btn-outline"
				>
					Get Instances Count
				</button>
			</div>
		</div>
	);
}
