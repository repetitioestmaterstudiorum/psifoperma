import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import validator from 'validator';
import { log } from '/imports/utils/logger';

// ---

export function sanitizeInput<T>(data: T, functionName: string, userId = 'unknown'): T {
	if (typeof data === 'string') {
		return sanitizeString(data as unknown as string, functionName, userId) as unknown as T;
	} else if (Array.isArray(data)) {
		return (data as unknown[]).map(element =>
			sanitizeInput(element, functionName, userId)
		) as unknown as T;
	} else if (typeof data === 'object' && data !== null) {
		return sanitizeObject(data as Record<string, unknown>, functionName, userId) as T;
	} else if (typeof data === 'number') {
		// If the data is a number, return it as is
		return data;
	} else {
		log.error(`Dangerous input detected in ${functionName} by user ${userId}.`);
		throw new Meteor.Error(
			'invalid-data',
			'Data must be a string, an object, or an array of strings or objects'
		);
	}
}

// Helper functions

function sanitizeString(data: string, functionName: string, userId = 'unknown'): string {
	check(data, String);

	// Reject data containing MongoDB selectors
	if (['$'].some(character => data.includes(character))) {
		log.error(`Dangerous input detected in ${functionName} by user ${userId}.`);
		throw new Meteor.Error('invalid-data', 'Data contains MongoDB selectors');
	}

	// Sanitize data to prevent XSS attacks
	const sanitized = validator.escape(data);

	// If the sanitized data differs from the original data, there was potential XSS attack
	if (sanitized !== data) {
		log.error(`Dangerous input detected in ${functionName} by user ${userId}.`);
		throw new Meteor.Error('invalid-data', 'Data contains potentially harmful content');
	}

	// If data is a URL, ensure it's safe
	if (validator.isURL(data) && !validator.isFQDN(data) && !validator.isEmail(data)) {
		log.error(`Dangerous input detected in ${functionName} by user ${userId}.`);
		throw new Meteor.Error('invalid-data', 'Data contains an unsafe URL');
	}

	return sanitized;
}

function sanitizeObject<T extends Record<string, unknown>>(
	data: T,
	functionName: string,
	userId = 'unknown'
): T {
	check(data, Match.ObjectIncluding({}));

	const sanitizedData = {} as T;

	for (const key in data) {
		sanitizedData[key] = sanitizeInput(data[key], functionName, userId);
	}

	return sanitizedData;
}
