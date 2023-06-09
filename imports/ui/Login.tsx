import { Meteor } from 'meteor/meteor';
import React, { useState } from 'react';
import { UserMeta } from '/imports/api/collections/users/users.collection';
import { useTracker } from 'meteor/react-meteor-data';
import Swal from 'sweetalert2';
import { isEmailAValidEmailAddress } from '/imports/utils/email-utils';
import { C } from '/imports/startup/client/client.constants';
import { log } from '/imports/utils/logger';
import _ from 'lodash';
import { logAndFireSwalError } from '/imports/ui/ui-utils/error.utils';

// ---

export function Login() {
	const [email, setEmail] = useState('');

	function submit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		const lowerTrimmedEmail = _.trim(_.toLower(email));
		const isEmailValid = isEmailAValidEmailAddress(lowerTrimmedEmail);
		if (!isEmailValid) {
			Swal.fire({
				title: 'Invalid email',
				text: 'Please enter a valid email address',
				icon: 'error',
				confirmButtonText: 'OK',
			});
			return;
		}

		login(email);
	}

	const user = useTracker(() => Meteor.user() as UserMeta | null);
	if (user) window.location.href = C.routes.home;

	return (
		<>
			<h2 className="text-xl font-bold mt-4 mb-2 text-center">Log in</h2>
			<p className="text-center">
				This will send an email to the address you provide, with a{' '}
				<strong>link to log in</strong> 📬{' '}
			</p>
			<br />
			<p className="text-center">
				New here? We will automatically create an account for you 🤯
			</p>

			<form onSubmit={submit} className="login-form p-6 mx-auto max-w-sm mt-2">
				<div className="mb-4">
					<label htmlFor="email" className="block font-bold mb-2">
						Email
					</label>
					<input
						type="text"
						placeholder="Email"
						name="email"
						required
						onChange={event => setEmail(event.target.value)}
						className="input input-bordered w-full max-w-xs"
						value={email}
					/>
				</div>

				<div className="flex justify-start space-x-3">
					<button type="submit" className="btn btn-sm btn-success">
						Send login link
					</button>
				</div>
			</form>
		</>
	);
}

export function login(email: string) {
	// @ts-ignore (Accounts typings are incomplete)
	Accounts.requestLoginTokenForUser({ selector: email }, async (error?: Meteor.Error | Error) => {
		if (error) {
			const meteorError = error instanceof Meteor.Error ? error : undefined;
			if (meteorError?.error === 403 && meteorError?.reason === 'User not found') {
				log.info(`login() User not found, creating user ${email}`);
				try {
					await Meteor.callAsync('users.addUser', email);
					return login(email);
				} catch (error) {
					logAndFireSwalError(error, 'login');
					return;
				}
			}
			logAndFireSwalError(error, 'login');
			return;
		}

		// can only use useNavigate in a React component
		window.location.href = `/check-your-email?email=${email}`;
	});
}
