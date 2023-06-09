import Swal from 'sweetalert2';
import { getErrMsg } from '/imports/utils/error-utils';
import { log } from '/imports/utils/logger';

// ---

export async function logAndFireSwalError(error: unknown, functionName: string, reload = true) {
	const errorMessage = getErrMsg(error);
	log.error(`${functionName}() ${errorMessage}`, error);

	await Swal.fire({
		title: 'Error',
		text: errorMessage,
		icon: 'error',
		confirmButtonText: 'OK',
	});

	if (reload) window.location.reload();
}
