import React from 'react';
import { C } from '/imports/startup/client/client.constants';
import { Link } from 'react-router-dom';

// ---

export const Legal = () => {
	return (
		<>
			<div className="text-sm breadcrumbs px-4">
				<ul>
					<li>
						<Link to={C.routes.home}>Home</Link>
					</li>
					<li>Legal</li>
				</ul>
			</div>
			<div className="p-4">
				<h2 className="text-xl">Legal Disclaimer</h2>

				<p className="mt-4">
					This website and the voting application ("App") powered by Ethereum blockchain
					technology are for demonstration purposes only and are not intended for actual
					use in a live, production environment. The App should not be used for real world
					use cases, especially not voting in elections or other official business.
				</p>

				<p className="mt-4">
					This App is provided on an "as is" and "as available" basis without any warranty
					of any kind. To the maximum extent permitted by law, we disclaim all warranties,
					including but not limited to, the implied warranties of merchantability, fitness
					for a particular purpose, and non-infringement. We make no warranty that the App
					will meet your requirements or be available on an uninterrupted, secure, or
					error-free basis. We make no warranty regarding the quality, accuracy,
					timeliness, truthfulness, completeness or reliability of the App.
				</p>

				<p className="mt-4">
					The App is based on Ethereum blockchain technology. As such, it is subject to
					the limitations and risks inherent in such technology, including the risk of
					virtual currency fluctuations, the risk of regulatory changes, and the risk of
					cyber-attacks. We are not responsible for any losses you may suffer as a result
					of using or attempting to use the App.
				</p>

				<p className="mt-4">
					In no event will we be liable to you or any third party for any indirect,
					incidental, special, consequential or punitive damages arising out of or related
					to your use of or inability to use the App.
				</p>

				<p className="mt-4">
					Any content provided by our App is of a general nature and purely informational.
					It is not intended to constitute legal, financial, or professional advice.
				</p>

				<p className="mt-4">
					By using this App, you agree to these terms and any additional terms that we may
					provide. If you do not agree to these terms, do not use the App.
				</p>

				<p className="mt-4">
					We reserve the right to modify these terms at any time. It is your
					responsibility to review these terms periodically. Your continued use of the App
					will be deemed acceptance of any updated or amended terms.
				</p>
			</div>
		</>
	);
};
