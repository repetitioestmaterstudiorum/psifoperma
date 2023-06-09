import { Meteor } from 'meteor/meteor';
import React from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { Link, Outlet } from 'react-router-dom';
import { UserMeta } from '/imports/api/collections/users/users.collection';
import { C } from '/imports/startup/client/client.constants';
import { getIsAdmin } from '/imports/api/collections/roles/roles.model';
import { getFirstEmailOrUsername } from '/imports/api/collections/users/users.model';
import Swal from 'sweetalert2';
import { logAndFireSwalError } from '/imports/ui/ui-utils/error.utils';

// ---

export function Root() {
	const user = useTracker(() => Meteor.user() as UserMeta | null);
	const isAdmin = user ? getIsAdmin(user._id) : false;

	return (
		<div className="max-w-screen-md mx-auto">
			<header className="navbar bg-base-100">
				<div className="flex-1">
					<h1 className="text-xl">
						<Link to={C.routes.home}>
							<img src="/logo.png" alt="Psifoperma" className="h-8" />
						</Link>
					</h1>
				</div>
				<div className="flex-none">
					<div className="dropdown dropdown-end">
						<label tabIndex={0} className="btn btn-sm btn-outline">
							Menu
						</label>
						<ul
							tabIndex={0}
							className="menu menu-compact dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-28"
							onClick={() => (document.activeElement as HTMLElement)?.blur?.()}
						>
							<li>
								<Link to={C.routes.home}>Home</Link>
							</li>
							<li>
								<Link to={C.routes.votes}>Votes</Link>
							</li>
							{isAdmin ? (
								<li>
									<Link to={C.routes.admin}>Admin</Link>
								</li>
							) : null}
							<li>
								<Link to={C.routes.legal}>Legal</Link>
							</li>
						</ul>
					</div>
					<div className="ml-1">
						{user ? (
							<div className="dropdown dropdown-end">
								<label tabIndex={0} className="btn btn-sm btn-ghost btn-info">
									&#128100;
								</label>
								<ul
									tabIndex={0}
									className="menu menu-compact dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box right-0  w-44"
								>
									<p className="text-right mb-3 text-sm">
										Logged in as: {getFirstEmailOrUsername(user)}
									</p>
									<li
										onClick={() => {
											Meteor.logout();
											window.location.href = C.routes.home;
										}}
									>
										<a>Logout</a>
									</li>
									<li
										onClick={async () => {
											try {
												const { bcAddress, bcPrivateKey } =
													await Meteor.callAsync('users.getWalletAndPk');

												if (!bcAddress || !bcPrivateKey) {
													throw new Error('No wallet info found');
												}

												Swal.fire({
													icon: 'info',
													title: 'Wallet info',
													html: `
														<p>Address: ${bcAddress}</p>
														<p>Private key: ${bcPrivateKey}</p>
													`,
												});
											} catch (error) {
												logAndFireSwalError(error, 'Wallet Info');
											}
										}}
									>
										<a>Wallet info</a>
									</li>
								</ul>
							</div>
						) : (
							<button className="btn btn-sm btn-outline btn-success">
								<Link to={C.routes.login}>Log in</Link>
							</button>
						)}
					</div>
				</div>
			</header>
			<div className="mx-2 md:mx-0">
				<Outlet />
			</div>
		</div>
	);
}
