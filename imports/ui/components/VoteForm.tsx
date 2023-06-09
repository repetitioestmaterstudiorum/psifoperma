import { Meteor } from 'meteor/meteor';
import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { logAndFireSwalError } from '/imports/ui/ui-utils/error.utils';

// ---

export function VoteForm() {
	const [title, setTitle] = useState('');

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		if (!title) {
			Swal.fire({
				title: 'Error',
				text: 'Vote text missing!',
				icon: 'error',
			});
		}

		try {
			await Meteor.callAsync('votes.insert', { title });
		} catch (error) {
			logAndFireSwalError(error, 'handleSubmit()');
		}

		setTitle('');
	}

	return (
		<form onSubmit={handleSubmit} className="mb-3">
			<div className="form-control">
				<div className="input-group">
					<input
						type="text"
						placeholder="Vote title"
						onChange={event => setTitle(event.target.value)}
						value={title}
						className="input input-bordered input-sm w-full max-w-xs"
					/>
					<button
						type="submit"
						className="btn btn-sm btn-info btn-outline"
						disabled={!title}
					>
						Add Vote
					</button>
				</div>
			</div>
		</form>
	);
}
