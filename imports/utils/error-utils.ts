export function getErrMsg(error: unknown) {
	let errorMessage;

	if (error instanceof Meteor.Error) {
		errorMessage = error.reason || error.details;
	} else if (error instanceof Error) {
		errorMessage = error.message;
	}

	return errorMessage ?? String(error) ?? 'Unknown error';
}
