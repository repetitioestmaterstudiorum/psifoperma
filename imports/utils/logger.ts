import _ from 'lodash';
import axios from 'axios';
import { Log } from '/imports/api/collections/logs/logs.collection';
import { insertLog } from '/imports/api/collections/logs/logs.model';
import { scrubServerData, sensitiveStrings } from '/imports/utils/privacy-utils';
import { getErrMsg } from '/imports/utils/error-utils';
import { C } from '/imports/startup/global.constants';

// ---

export const log = {
	info: (text: string, data?: LogParams['data']) => logger({ text, data, severity: 'info' }),
	error: (text: string, data?: LogParams['data']) => logger({ text, data, severity: 'error' }),
};

async function logger({ text, data, severity = 'info' }: LogParams) {
	const timestamp = new Date();
	const dataSafe = scrubServerData(data, sensitiveStrings);

	// Log to stdout / stderr with timestamp - this always happens
	logToStd({
		text,
		data: dataSafe,
		severity,
		timestamp,
	});

	// Call functions that rely on external services that could fail, and retry in case
	const functionsToCall = [logToDb, logToLogtail];

	const functionCallResults = functionsToCall.map(fn =>
		callFnWithRetries(fn, { text, data: dataSafe, severity, timestamp })
	);

	return Promise.all(functionCallResults).then(_ => ({
		text,
		data: dataSafe,
		severity,
		timestamp,
	}));
}

// Colorized log function, stringifies if data is an object, called in any case when log() is called
function logToStd({ text, data, severity, timestamp }: RetriableFnParams) {
	// Color codes for logging (https://simplernerd.com/js-console-colors/)
	const colorCode = severity === 'info' ? '\x1b[32m%s\x1b[0m' : '\x1b[31m%s\x1b[0m';

	// @ts-ignore
	console[severity](colorCode, `${timestamp.toISOString()}`, text);
	if (data) {
		if (_.isObject(data) && !_.isEmpty(data)) data = JSON.stringify(data, null, 2);
		// @ts-ignore
		console[severity](data);
	}
}

async function logToDb({ text, data, severity, timestamp }: RetriableFnParams) {
	const log = {
		text,
		data,
		severity,
		timestamp,
		hostname: C.app.hostname,
		env: C.app.env,
	};

	insertLog(log);
}

async function logToLogtail({ text, data, severity, timestamp }: RetriableFnParams) {
	if (C.app.isClient || C.app.isDev) return;

	// eslint-disable-next-line
	const { getMemoizedSetting } = require('/imports/startup/server/settings/settings.model');

	const logtailConfig = await getMemoizedSetting('logtail', 30, false);
	if (!logtailConfig || !logtailConfig.token || !logtailConfig.url) {
		return console.error('Logtail config not found. Aborting logToLogtail()');
	}

	return await axios({
		method: 'post',
		url: logtailConfig.url,
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${logtailConfig.token}`,
		},
		data: {
			dt: timestamp,
			hostname: C.app.hostname,
			service_name: C.app.name,
			environment: C.app.env,
			level: severity,
			message: text,
			data,
		},
	});
}

// Call retriable functions that depend on external services
const defaultRetriesLeft = 10;
const baseTimeoutInS = 3; // has to be > 1 for Math.pow() to have an effect
const maxTimeoutInM = 15; // wait no longer than 20min between retries

async function callFnWithRetries(
	fn: RetriableFunctions,
	logParams: RetriableFnParams,
	retriesLeft = defaultRetriesLeft
) {
	try {
		await fn(logParams);
	} catch (e) {
		if (retriesLeft) {
			// Calculate next timeout
			// prettier-ignore
			const timeout = Math.ceil(Math.min(
				Math.pow(baseTimeoutInS, defaultRetriesLeft - retriesLeft),
				maxTimeoutInM * 60 // max timeout in seconds
			))

			const errMsg = getErrMsg(e);
			logToStd({
				text: `callFnWithRetries() error calling ${fn.name}(): "${errMsg}". Retries left: ${retriesLeft}. Next timeout: ${timeout}s`,
				severity: 'error',
				timestamp: new Date(),
			});

			// Wait on increasing timeout
			await new Promise(resolve => {
				setTimeout(resolve, timeout * 1000);
			});

			// Retry with one less retry left
			callFnWithRetries(fn, logParams, retriesLeft - 1);
		} else {
			logToStd({
				text: `callFnWithRetries(): failed calling "${fn.name}()" (no more retries)`,
				data: e,
				severity: 'error',
				timestamp: new Date(),
			});
		}
	}
}

type RetriableFunctions = typeof logToLogtail | typeof logToDb;

type LogParams = {
	text: Log['text'];
	data?: Log['data'];
	severity?: Log['severity'];
};

type RetriableFnParams = {
	text: Log['text'];
	data?: Log['data'];
	severity: Log['severity'];
	timestamp: Date;
};
