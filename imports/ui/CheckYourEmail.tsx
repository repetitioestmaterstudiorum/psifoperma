import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { C } from '/imports/startup/client/client.constants';

// ---

export function CheckYourEmail() {
	// get the email from the URL using react router dom
	const [searchParams] = useSearchParams();
	const email = searchParams.get('email');

	return (
		<>
			<h2 className="text-xl font-bold mt-4 text-center">Check your email </h2>
			<p className="text-center">📬 We sent you an email {email ? ` to ${email}.` : ''}</p>
			<br />
			<p className="text-center">
				Didn't work?{' '}
				<Link to={C.routes.login}>
					<span className="link">Try again .. </span>
				</Link>
			</p>
		</>
	);
}
