import React from 'react';
import { useRouteError, useNavigate } from 'react-router-dom';
import { log } from '/imports/utils/logger';
import { C } from '/imports/startup/client/client.constants';

export function ErrorPage() {
	const error = useRouteError() as Error;
	log.error('ErrorPage error', error);

	const navigate = useNavigate();

	return (
		<div className="flex flex-col items-center justify-center h-screen">
			<h1 className="text-4xl font-bold text-red-500">Error</h1>
			<p className="text-lg mt-2 mb-5">
				{[error.statusText, error.message].filter(Boolean).join(' ')}
			</p>
			<button className="btn btn-outline btn-sm" onClick={() => navigate(C.routes.home)}>
				Back to Home
			</button>
		</div>
	);
}

type Error = {
	statusText?: string;
	message?: string;
};
