import React from 'react';
import { Link } from 'react-router-dom';
import { C } from '/imports/startup/client/client.constants';
import { UserMeta } from '/imports/api/collections/users/users.collection';
import { useTracker } from 'meteor/react-meteor-data';
import { getFirstEmailOrUsername } from '/imports/api/collections/users/users.model';

export function Home() {
	const user = useTracker(() => Meteor.user() as UserMeta | null);

	return (
		<>
			<div className="p-4">
				{user ? (
					<div className="my-8 w-full">
						<p className="text-center">
							You are logged in as <strong>{getFirstEmailOrUsername(user)}</strong>
						</p>
						<div className="flex justify-center items-center w-full mt-4">
							<button className="btn btn-outlined btn-sm btn-success">
								<Link to={C.routes.votes}>Go to Votes</Link>
							</button>
						</div>
					</div>
				) : null}

				<h2 className="text-xl mb-1">Welcome to Psifoperma!</h2>

				<p>
					Psifoperma is an ethereum-based, pseudonymous and transparent DEMO voting app
					that lets small companies and clubs create votes, and invite voters.{' '}
				</p>
				<br />
				<p>
					This app is also our final project for the blockchain course at{' '}
					<a href="https://hslu.ch" target="_blank" rel="noreferrer">
						HSLU
					</a>
					. It interacts with Ethereum's test network Sepolia. Voting results can be seen
					in the app and on etherscan.
				</p>
				<br />
				<p>
					However, since Ethereum is a public blockchain, it is not suitable for a voting
					system that requires anonymity. Nevertheless, this is a showcase of how we can
					use blockchain technology for voting.
				</p>
				<br />
				<button className="btn btn-sm btn-outline btn-success">
					<Link to={user ? C.routes.votes : C.routes.login}>Try it out</Link>
				</button>
				<div className="flex justify-center items-center bottom-0 w-full mt-10 mb-4 font-light text-sm">
					<Link to={C.routes.legal}>Legal Disclaimer</Link>
				</div>
			</div>
		</>
	);
}
