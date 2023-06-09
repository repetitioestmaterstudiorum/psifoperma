import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import { findVotes } from '/imports/api/collections/votes/votes.model';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useFind, useSubscribe } from 'meteor/react-meteor-data';
import { Loading } from '/imports/ui/components/Loading';
import { VoteMeta } from '/imports/api/collections/votes/votes.collection';
import { redirectIfNotLoggedIn } from './ui-utils/redirect-utils';
import _ from 'lodash';
import { generateRandomName } from '/imports/utils/random-utils';
import { C } from '/imports/startup/client/client.constants';
import { logAndFireSwalError } from '/imports/ui/ui-utils/error.utils';
import { isEmailAValidEmailAddress } from '/imports/utils/email-utils';
import { UserMeta } from '/imports/api/collections/users/users.collection';
import { getIsAdmin } from '/imports/api/collections/roles/roles.model';

// ---

export function Vote() {
	const navigate = useNavigate();
	const descriptionRef = useRef<HTMLTextAreaElement>(null);
	const titleRef = useRef<HTMLInputElement>(null);
	const { voteId } = useParams();
	if (!voteId) {
		navigate('-1');
		return null;
	}

	const isLoading = useSubscribe('votes');
	const vote = useFind(() => findVotes({ _id: voteId }), [voteId])?.[0] as VoteMeta | undefined;
	const user = Meteor.user() as UserMeta | undefined;
	const isAdmin = getIsAdmin(user?._id || '');
	const isVoteOwner = vote?.userId === user?._id;
	const isDraft = vote?.status === C.votes.statuses.draft;
	const isActive = vote?.status === C.votes.statuses.active;
	const isCompleted = vote?.status === C.votes.statuses.completed;
	const isVoteVoter = vote?.voters.includes(Meteor.user()?.emails?.[0]?.address || '');

	const userWalletAddress = user?.profile?.bcAddress;
	const userVoteEntry = vote?.votes?.[userWalletAddress || ''];
	const optionIndex = userVoteEntry?.optionIndex;
	const transactionHashVote = userVoteEntry?.transactionHash;
	const transactionHashVoting = vote?.transactionHash;
	const userChoice = vote?.options[optionIndex || -1] || 'None';
	const deadlineJSDate = vote?.deadlineJSDate;

	const hasVoted = user?._id ? !!vote?.votes?.[userWalletAddress || ''] : false;

	if (isLoading()) return <Loading />;
	redirectIfNotLoggedIn(isLoading(), C.routes.login);

	const autoResize = (e: ChangeEvent<HTMLTextAreaElement>) => {
		if (descriptionRef.current) {
			descriptionRef.current.style.height = 'auto';
			descriptionRef.current.style.height = `${e.target.scrollHeight + 5}px`;
		}
	};
	const resizeToDefault = () => {
		if (descriptionRef.current) {
			descriptionRef.current.style.height = 'auto';
			descriptionRef.current.style.height = '100px';
		}
	};

	const maxDurationInMinutes = C.blockchain.limits.durationInMinutes;
	const maxDurationInDays = Math.floor(maxDurationInMinutes / 60 / 24);

	return (
		<>
			{vote ? (
				<>
					<div className="text-sm breadcrumbs px-4">
						<ul>
							<li>
								<Link to={C.routes.home}>Home</Link>
							</li>
							<li>
								<Link to={C.routes.votes}>Votes</Link>
							</li>
							<li>{vote.title}</li>
						</ul>
					</div>

					{/* Vote contents */}
					<div className="p-4">
						{/* Title */}
						<div className="flex justify-between items-center mb-3">
							<h2 className="w-full mr-2">
								<input
									disabled={!isVoteOwner || !isDraft}
									type="text"
									defaultValue={vote.title}
									ref={titleRef}
									onKeyUp={() => {
										debouncedUpdateVoteTitle({
											voteId: vote._id,
											title: _.trim(titleRef.current?.value),
										});
									}}
									onBlur={() => {
										// If the title is empty, generate a random one
										const title =
											titleRef.current?.value ||
											`${generateRandomName()} Vote`;
										titleRef.current!.value = title;
										debouncedUpdateVoteTitle({
											voteId: vote._id,
											title: _.trim(titleRef.current?.value),
										});
									}}
									className="input border-1 border-gray-500 rounded input-md w-full text-xl text-left"
								/>
							</h2>
							<button
								disabled={!isVoteOwner || !isDraft}
								onClick={() => deleteVote({ voteId: vote._id, navigate })}
								className="btn btn-sm btn-error btn-outline"
							>
								Delete
							</button>
						</div>

						{/* Meta */}
						<div className="flex flex-col space-y-3">
							<p>
								<span className="font-medium">Created at:</span>{' '}
								{vote.createdAt.toLocaleString('de-CH', {
									day: '2-digit',
									month: '2-digit',
									year: 'numeric',
									hour: '2-digit',
									minute: '2-digit',
								})}
							</p>
							<p>
								<span className="font-medium">Status:</span>{' '}
								{vote.status ? _.startCase(vote.status) : ''}
							</p>
							{isActive || isCompleted ? (
								<p>
									Voting deployment hash:{' '}
									<a
										className="link"
										href={`https://sepolia.etherscan.io/tx/${transactionHashVoting}`}
										target="_blank"
										rel={'noreferrer'}
									>
										{transactionHashVoting}
									</a>
								</p>
							) : null}
							<p className="mb-1 font-medium">Description: (Optional)</p>
							<textarea
								disabled={!isVoteOwner || !isDraft}
								className="textarea w-full border-1 border-gray-500 rounded p-2"
								placeholder="Description of the vote"
								ref={descriptionRef}
								rows={3}
								defaultValue={vote.description}
								onKeyUp={() =>
									debouncedUpdateVoteDescription({
										voteId: vote._id,
										description: descriptionRef.current?.value || '',
									})
								}
								onInput={autoResize}
								onFocus={autoResize}
								onBlur={resizeToDefault}
							></textarea>
						</div>

						{/* Vote Duration */}
						<h3 className="mt-6 mb-2 text-lg font-medium">Vote duration</h3>
						{!isVoteOwner || !isDraft ? null : (
							<p>
								Set the duration of the vote (max {maxDurationInDays} days from
								now).
							</p>
						)}
						<select
							disabled={!isVoteOwner || !isDraft}
							className="select select-bordered select-sm w-full max-w-xs mt-3"
							defaultValue={vote.durationInMinutes / 60 / 24 || 0}
							onChange={async event => {
								const selectedDays = event.target.value ? +event.target.value : 0;
								try {
									await Meteor.callAsync('votes.updateDurationInMinutes', {
										voteId: vote._id,
										durationInMinutes: Math.round(selectedDays * 60 * 24),
									});
								} catch (error) {
									logAndFireSwalError(error, 'updateDurationInMinutes()');
								}
							}}
						>
							<option value={0}>Choose a duration</option>
							{[...Array(maxDurationInDays)].map((_, index) => (
								<option key={index} value={index + 1}>
									{index + 1} day{index === 0 ? '' : 's'}
								</option>
							))}
							{C.app.isDev || isAdmin ? (
								<option value={0.00208333}>3 min (admin/dev option only)</option>
							) : null}
						</select>
						{deadlineJSDate ? (
							<p className="mt-4">
								Deadline:{' '}
								{deadlineJSDate?.toLocaleString('de-CH', {
									day: '2-digit',
									month: '2-digit',
									year: 'numeric',
									hour: '2-digit',
									minute: '2-digit',
								})}
							</p>
						) : null}

						{/* Options */}
						{isDraft ? (
							<>
								<h3 className="mt-6 mb-2 text-lg font-medium">Options</h3>
								{!isVoteOwner || !isDraft ? null : (
									<p>Only one option can be selected by voters.</p>
								)}
								<OptionDynList
									voteId={vote._id}
									options={vote.options}
									disabled={!isVoteOwner || !isDraft}
								/>
							</>
						) : null}

						{/* Voters */}
						<h3 className="mt-6 mb-2 text-lg font-medium">Email addresses of voters</h3>
						{!isVoteOwner || !isDraft ? null : (
							<p className="text-m">
								These voters will receive an email with a link to this vote.
							</p>
						)}
						<VoterDynList
							voteId={vote._id}
							voters={vote.voters}
							disabled={!isVoteOwner || !isDraft}
						/>

						{/* Launch vote */}
						{!isVoteOwner || !isDraft ? null : (
							<div className="flex justify-start mt-6">
								<button
									className="btn btn-primary btn-outline btn-sm"
									onClick={async () => {
										// Perform checks
										if (vote.options.length < 2) {
											Swal.fire({
												title: 'Not enough options',
												text: 'Please add at least two options to the vote.',
												icon: 'error',
											});
											return;
										}
										if (vote.voters.length === 0) {
											Swal.fire({
												title: 'No voters',
												text: 'Please add at least one voter to the vote.',
												icon: 'error',
											});
											return;
										}
										if (vote.durationInMinutes === 0) {
											Swal.fire({
												title: 'No duration',
												text: 'Please set a duration for the vote.',
												icon: 'error',
											});
											return;
										}

										// Verify that all voters are valid email addresses using isEmailAValidEmailAddress
										const invalidEmails = vote.voters.filter(
											email => !isEmailAValidEmailAddress(email)
										);
										if (invalidEmails.length > 0) {
											Swal.fire({
												title: 'Invalid email address',
												text: `The following email addresses are invalid: ${invalidEmails.join(
													', '
												)}`,
												icon: 'error',
											});
											return;
										}

										if (vote.voters.length < 2) {
											Swal.fire({
												title: 'Not enough voters',
												text: 'Please add at least two voters to the vote.',
												icon: 'error',
											});
											return;
										}

										if (
											!vote.durationInMinutes ||
											vote.durationInMinutes === 0
										) {
											Swal.fire({
												title: 'No duration',
												text: 'Please set a duration for the vote.',
												icon: 'error',
											});
											return;
										}

										try {
											await Meteor.callAsync('votes.launch', {
												voteId: vote._id,
											});
											Swal.fire({
												title: 'Vote launched!',
												text: 'The vote has been launched.',
												icon: 'success',
											});
										} catch (error) {
											logAndFireSwalError(error, 'launchVote()');
										}
									}}
								>
									Launch vote
								</button>
							</div>
						)}

						{/* Vote form */}
						{isVoteVoter && (isActive || isCompleted) ? (
							<div className="flex flex-col space-y-4 mt-6">
								<h3 className="text-lg font-medium">Vote</h3>
								<p>Your choice: {userChoice}</p>

								{hasVoted ? (
									<p>
										Transaction hash:{' '}
										<a
											className="link"
											href={`https://sepolia.etherscan.io/tx/${transactionHashVote}`}
											target="_blank"
											rel={'noreferrer'}
										>
											{transactionHashVote}
										</a>
									</p>
								) : null}

								{isCompleted || hasVoted ? null : (
									<>
										<p className="text-m">
											Select one option and click on the button below to vote.
										</p>

										<form
											onSubmit={async event => {
												event.preventDefault();

												const selectedOption =
													// @ts-ignore
													event.target['vote-option']?.value;

												if (selectedOption === undefined) {
													Swal.fire({
														title: 'No option selected',
														text: 'Please select an option to vote.',
														icon: 'error',
													});
													return;
												}

												try {
													await Meteor.callAsync('votes.vote', {
														voteId: vote._id,
														optionIndex: selectedOption,
													});
													Swal.fire({
														title: 'Vote submitted!',
														text: 'Your vote has been submitted.',
														icon: 'success',
													});
												} catch (error) {
													logAndFireSwalError(error, 'vote()');
												}
											}}
										>
											<div className="flex flex-col space-y-0">
												{vote.options.map((option, index) => (
													<div
														key={index}
														className="flex items-center space-x-4 whitespace-nowrap"
													>
														<label className="label m-0 p-0">
															<input
																type="radio"
																name="vote-option"
																value={index}
																className="input input-sm"
															/>
															<span className="ml-2">{option}</span>
														</label>
													</div>
												))}
											</div>
											<button className="btn btn-primary btn-outline btn-sm mt-5">
												Vote
											</button>
										</form>
									</>
								)}
							</div>
						) : null}

						{/* Vote results */}
						{isActive || isCompleted ? (
							<div className="flex flex-col space-y-4 mt-6">
								<h3 className="text-lg font-medium">Results</h3>
								{
									<Results
										voteId={vote._id}
										userId={user?._id || ''}
										isCompleted={isCompleted}
									/>
								}
							</div>
						) : null}
					</div>
				</>
			) : (
				<div className="text-center mt-2">
					<p>Vote with ID {voteId} not found!</p>
					<button className="btn btn-outline btn-sm mt-3" disabled={hasVoted}>
						<Link to={C.routes.votes}>Back to Votes</Link>
					</button>
				</div>
			)}
		</>
	);
}

export function VoterDynList(props: { voteId: string; voters: string[]; disabled: boolean }) {
	const addEmptyVoter = (voters: string[]) => {
		if (props.disabled) return voters;
		if (!voters || voters?.length === 0) return [''];
		return voters.concat('');
	};

	const handleDeleteVoter = async (index: number) => {
		const updatedVoters = [...props.voters];
		updatedVoters.splice(index, 1);

		try {
			await Meteor.callAsync('votes.updateVoters', {
				voteId: props.voteId,
				voters: updatedVoters,
			});
			window.location.reload();
		} catch (error) {
			logAndFireSwalError(error, 'handleDeleteVoter()');
			return;
		}
	};

	return (
		<div className="flex flex-col space-y-4 mt-4">
			{addEmptyVoter(props.voters).map((voter, index) => {
				const isEmptyVoter = voter === '';

				return (
					<div key={index} className="flex items-center space-x-4 whitespace-nowrap">
						<span>Voter {index + 1}</span>
						<input
							disabled={props.disabled}
							type="text"
							placeholder="Add voter email address"
							className="input border-1 border-gray-500 rounded input-bordered input-sm w-full"
							onChange={async event => {
								const lowerTrimmedEmail = _.trim(_.toLower(event.target.value));

								if (lowerTrimmedEmail === '') handleDeleteVoter(index);

								const updatedVoters = [...props.voters];
								updatedVoters[index] = lowerTrimmedEmail;

								await debouncedUpdateVoters({
									voteId: props.voteId,
									voters: updatedVoters,
								});
							}}
							defaultValue={voter}
						/>

						{isEmptyVoter ? null : (
							<button
								disabled={props.disabled}
								onClick={() => handleDeleteVoter(index)}
								className="btn btn-sm btn-error btn-outline"
							>
								X
							</button>
						)}
					</div>
				);
			})}
		</div>
	);
}

const debouncedUpdateVoters = _.debounce(updateVoters, 200);
async function updateVoters({ voteId, voters }: { voteId: string; voters: string[] }) {
	try {
		await Meteor.callAsync('votes.updateVoters', { voteId, voters });
	} catch (error) {
		logAndFireSwalError(error, 'updateVoters()');
	}
}

export function OptionDynList(props: { voteId: string; options: string[]; disabled: boolean }) {
	const addEmptyOption = (options: string[]) => {
		if (props.disabled) return options;
		if (!options || options?.length === 0) return [''];
		return options.concat('');
	};

	const handleDeleteOption = async (index: number) => {
		const updatedOptions = [...(props.options || [''])];
		updatedOptions.splice(index, 1);

		try {
			await Meteor.callAsync('votes.updateOptions', {
				voteId: props.voteId,
				options: updatedOptions,
			});
			window.location.reload();
		} catch (error) {
			logAndFireSwalError(error, 'handleDeleteOption()');
			return;
		}
	};

	return (
		<div className="flex flex-col space-y-4 mt-4">
			{addEmptyOption(props.options).map((option, index) => {
				const isEmptyOption = option === '';

				return (
					<div key={index} className="flex items-center space-x-4 whitespace-nowrap">
						<span>Option {index + 1}</span>
						<input
							disabled={props.disabled}
							type="text"
							placeholder="Add option"
							className="input border-1 border-gray-500 rounded input-bordered input-sm w-full"
							onChange={async event => {
								const newOption = event.target.value?.trim();
								if (newOption === '') handleDeleteOption(index);

								const updatedOptions = props.options ? [...props.options] : [];
								updatedOptions[index] = newOption;

								await debouncedUpdateOptions({
									voteId: props.voteId,
									options: updatedOptions,
								});
							}}
							defaultValue={option}
						/>

						{isEmptyOption ? null : (
							<button
								disabled={props.disabled}
								onClick={() => handleDeleteOption(index)}
								className="btn btn-sm btn-error btn-outline"
							>
								X
							</button>
						)}
					</div>
				);
			})}
		</div>
	);
}

const debouncedUpdateOptions = _.debounce(updateOptions, 200);
async function updateOptions({ voteId, options }: { voteId: string; options: string[] }) {
	try {
		await Meteor.callAsync('votes.updateOptions', { voteId, options });
	} catch (error) {
		logAndFireSwalError(error, 'updateOptions()');
	}
}

const debouncedUpdateVoteDescription = _.debounce(updateVoteDescription, 500);
async function updateVoteDescription({
	voteId,
	description,
}: {
	voteId: string;
	description: string;
}) {
	try {
		await Meteor.callAsync('votes.updateDescription', {
			voteId,
			description,
		});
	} catch (error) {
		logAndFireSwalError(error, 'updateVoteDescription()');
	}
}

const debouncedUpdateVoteTitle = _.debounce(updateVoteTitle, 500);
async function updateVoteTitle({ voteId, title }: { voteId: string; title: string }) {
	try {
		await Meteor.callAsync('votes.updateTitle', {
			voteId,
			title,
		});
	} catch (error) {
		logAndFireSwalError(error, 'updateVoteTitle()');
	}
}

async function deleteVote({
	voteId,
	navigate,
}: {
	voteId: string;
	navigate: (path: string) => void;
}) {
	Swal.fire({
		title: 'Are you sure?',
		text: 'You will not be able to recover this vote!',
		icon: 'warning',
		showCancelButton: true,
		confirmButtonText: 'Yes, delete it!',
		cancelButtonText: 'No, keep it',
	}).then(async result => {
		if (result.isConfirmed) {
			try {
				await Meteor.callAsync('votes.remove', { voteId });
				return navigate(C.routes.votes);
			} catch (error) {
				logAndFireSwalError(error, 'deleteVote()');
			}
		}
	});
}

function Results(props: { voteId: string; userId: string; isCompleted: boolean }) {
	const [proposals, setProposals] = useState<Proposal[]>([]);
	const [isError, setIsError] = useState(false);
	const [countdown, setCountdown] = useState(10);

	const timeoutInSeconds = 10; // Define your timeout constant here

	const getProposals = async () => {
		try {
			const { proposals } = await Meteor.callAsync('votes.getVoteState', {
				voteId: props.voteId,
				userId: props.userId,
			});

			setProposals(proposals);
		} catch (error) {
			setIsError(true);
			logAndFireSwalError(error, 'getVoteState()', false);
		}
	};

	useEffect(() => {
		if (props.isCompleted) {
			getProposals();
			return;
		}

		const intervalId = setInterval(() => {
			getProposals();
		}, timeoutInSeconds * 1000);

		return () => {
			clearInterval(intervalId);
		};
	}, []);

	useEffect(() => {
		if (props.isCompleted) return;

		const countdownInterval = setInterval(() => {
			setCountdown(prevCountdown => {
				if (prevCountdown === 1) {
					return timeoutInSeconds;
				} else {
					return prevCountdown - 1;
				}
			});
		}, 1000);

		return () => {
			clearInterval(countdownInterval);
		};
	}, []);

	const maxVotes = Math.max(...proposals.map(proposal => proposal.voteCount));

	if (isError)
		return (
			<div>
				<p className="text-error">Error while fetching proposals</p>
				<button
					className="btn btn-outline btn-sm mt-4"
					onClick={() => window.location.reload()}
				>
					Retry
				</button>
			</div>
		);

	return proposals.length === 0 ? (
		<Loading />
	) : (
		<div className="mt-2">
			{props.isCompleted ? null : <p className="mb-2">Next update in: {countdown}s</p>}
			<table className="table">
				<thead>
					<tr>
						<th>Option</th>
						<th>Title</th>
						<th>Votes</th>
						<th>Winner</th>
					</tr>
				</thead>
				<tbody>
					{proposals.map((proposal, index) => (
						<tr key={index}>
							<td>{index + 1}</td>
							<td>{proposal.title}</td>
							<td>{proposal.voteCount}</td>
							<td>
								{proposal.voteCount == maxVotes && props.isCompleted ? '🏆' : ''}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

type Proposal = {
	title: string;
	voteCount: number;
};
