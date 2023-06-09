import { Meteor } from 'meteor/meteor';
import React, { useState } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { VoteForm } from '/imports/ui/components/VoteForm';
import { Loading } from '/imports/ui/components/Loading';
import { findVotes } from '/imports/api/collections/votes/votes.model';
import { Link, useNavigate } from 'react-router-dom';
import { redirectIfNotLoggedIn } from './ui-utils/redirect-utils';
import { C } from '/imports/startup/client/client.constants';
import _ from 'lodash';
import { getIsUser } from '/imports/api/collections/roles/roles.model';
import { getIsAdmin } from '/imports/api/collections/roles/roles.model';

// ---

export function Votes() {
	const [statusFilter, setStatusFilter] = useState<Record<string, string> | null>({});
	const navigate = useNavigate();

	const { votes, pendingVotesCount, isLoading, isUser, isAdmin } = useTracker(() => {
		const user = Meteor.user() as Meteor.User | null;

		const noData = {
			votes: [],
			pendingVotesCount: 0,
			isAdmin: false,
			isUser: false,
		};
		if (!user?._id) return { ...noData, isLoading: false };

		const votesSubHandler = Meteor.subscribe('votes');
		const usersSubHandler = Meteor.subscribe('users');
		if (!votesSubHandler.ready() || !usersSubHandler.ready()) {
			return { ...noData, isLoading: true };
		}

		const userFilter = { $or: [{ userId: user._id }, { voters: user.emails?.[0]?.address }] };
		const filter = statusFilter ? { ...statusFilter, ...userFilter } : { ...userFilter };
		const votes = findVotes(filter, {
			sort: { createdAt: -1 },
		}).fetch();
		const pendingVotesCount = findVotes(filter).count();

		const isAdmin = getIsAdmin(user._id);
		const isUser = getIsUser(user._id);

		return { votes, pendingVotesCount, isLoading: false, isAdmin, isUser };
	});

	redirectIfNotLoggedIn(isLoading, C.routes.login);

	return isLoading ? (
		<Loading />
	) : (
		<>
			<div className="text-sm breadcrumbs px-4">
				<ul>
					<li>
						<Link to={C.routes.home}>Home</Link>
					</li>
					<li>Votes</li>
				</ul>
			</div>
			<div className="p-4">
				<div className="flex justify-between items-center mb-4">
					<div>
						<h2 className="text-xl mb-1">Votes ({pendingVotesCount})</h2>
					</div>
					<div>
						<span>Status: </span>
						<select
							className="select select-bordered select-sm mt-1"
							onChange={e => {
								const status = e.target.value;
								if (status === 'all') {
									setStatusFilter(null);
								} else {
									setStatusFilter({ status });
								}
							}}
							defaultValue={'all'}
						>
							<option value="all">All</option>
							{Object.values(C.votes.statuses).map(status => (
								<option key={status} value={status}>
									{_.startCase(status)}
								</option>
							))}
						</select>
					</div>
				</div>

				{isUser || isAdmin ? <VoteForm /> : null}

				<div className="overflow-x-auto">
					<table className="table w-full">
						<thead>
							<tr>
								<th>Title</th>
								<th>Status</th>
							</tr>
						</thead>
						<tbody>
							{votes.map(vote => (
								<tr
									key={vote._id}
									className="hover"
									onClick={() => navigate(`/vote/${vote._id}`)}
								>
									<td>{vote.title}</td>
									<td>{_.startCase(vote.status)}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</>
	);
}
