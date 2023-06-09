import { Setting, SettingsCollection } from '/imports/startup/server/settings/settings.collection';
import { findOne, MeteorMongoSelector, FindOptions } from '/imports/api/db/db.generic-functions';
import _ from 'lodash';
import { _defaultSettings } from '/imports/startup/server/settings/default-settings';

// ---

export async function getSetting(key: Setting['key']) {
	console.info(`getSetting: ${key}`);

	const dbSetting = await findOneSetting({ key });

	return dbSetting?.value ?? _.get(_defaultSettings, key);
}

const memoizedSettings: Record<string, MemoizedSetting> = {};
export async function getMemoizedSetting(key: Setting['key'], memoryInMin = 5, log = true) {
	const currentTime = Date.now();

	if (memoizedSettings[key] && currentTime < memoizedSettings[key].expiry) {
		if (log) console.info(`getMemoizedSetting (cached): ${key}`);
		return memoizedSettings[key].value;
	}

	if (log) console.info(`getMemoizedSetting (not cached): ${key}`);
	const dbSetting = await findOneSetting({ key });
	const settingValue = dbSetting?.value ?? _.get(_defaultSettings, key);

	const expiryInMs = currentTime + memoryInMin * 60 * 1000;
	memoizedSettings[key] = { value: settingValue, expiry: expiryInMs };

	return settingValue;
}

type MemoizedSetting = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	value: any;
	expiry: number;
};

// CRUD ------------------------------------------------------------------------

async function findOneSetting(selector: MeteorMongoSelector<Setting>, options: FindOptions = {}) {
	return await findOne(SettingsCollection, selector, options);
}
