import { Meteor } from 'meteor/meteor';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Root } from '/imports/ui/Root';
import { Home } from '/imports/ui/Home';
import { Login } from '/imports/ui/Login';
import { Admin } from '/imports/ui/Admin';
import { ErrorPage } from '/imports/ui/Error';
import '/imports/startup/methods';
import { Loading } from '/imports/ui/components/Loading';
import { CheckYourEmail } from '../imports/ui/CheckYourEmail';
import { C } from '/imports/startup/client/client.constants';
import { Vote } from '/imports/ui/Vote';
import { Votes } from '/imports/ui/Votes';
import { Legal } from '/imports/ui/Legal';

// ---

Meteor.startup(() => {
	const children = [
		{
			path: C.routes.home,
			element: <Home />,
		},
		{
			path: C.routes.votes,
			element: <Votes />,
		},
		{
			path: C.routes.vote,
			element: <Vote />,
		},
		{
			path: C.routes.admin,
			element: <Admin />,
		},
		{
			path: C.routes.login,
			element: <Login />,
		},
		{
			path: C.routes.checkYourEmail,
			element: <CheckYourEmail />,
		},
		{
			path: C.routes.legal,
			element: <Legal />,
		},
	];

	if (C.app.isDev && !C.app.isProdSimulation) {
		children.push({
			path: C.routes.loading,
			element: <Loading />,
		});
	}

	const router = createBrowserRouter([
		{
			path: C.routes.home,
			element: <Root />,
			errorElement: <ErrorPage />,
			children,
		},
	]);

	const root = ReactDOM.createRoot(document.getElementById('react-target') as HTMLElement);
	root.render(
		<React.StrictMode>
			<RouterProvider router={router} />
		</React.StrictMode>
	);
});
