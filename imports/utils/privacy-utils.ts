import _ from 'lodash';

// ---

export function scrubServerData(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	obj: Record<string, any>,
	keys: string[],
	replaceWith = 'server-scrubbed'
) {
	for (const key of keys) {
		for (const prop in obj) {
			if (obj.hasOwnProperty(prop)) {
				if (prop === key) {
					obj[prop] = replaceWith;
				} else if (typeof obj[prop] === 'object') {
					scrubServerData(obj[prop], [key], replaceWith);
				} else if (typeof obj[prop] === 'string') {
					if (obj[prop].includes(key)) {
						let parsedString;
						try {
							parsedString = JSON.parse(obj[prop]);
						} catch (_) {
							continue;
						}

						if (typeof parsedString !== 'object') continue;
						if (parsedString.oneLevelParseGuard) continue;

						const scrubbedStringObject = scrubServerData(
							{ ...parsedString, oneLevelParseGuard: true },
							[key],
							replaceWith
						);

						obj[prop] = JSON.stringify(
							_.omit(scrubbedStringObject, ['oneLevelParseGuard'])
						);
					}
				}
			}
		}
	}
	return obj;
}

export const sensitiveStrings = [
	'licenseKey',
	'apiKey',
	'ipWhitelist',
	'ki',
	'password',
	'key',
	'mongoUri',
	'uri',
	'secret',
];
