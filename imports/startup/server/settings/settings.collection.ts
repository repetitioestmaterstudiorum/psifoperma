import { Mongo } from 'meteor/mongo';
import { WithOptionalMetaFields, WithMetaFields } from '/imports/api/db/db.generic-functions';
import { NestedKeyOf } from '/imports/utils/type-utils';
import { _defaultSettings } from '/imports/startup/server/settings/default-settings';

// ---

export const SettingsCollection = new Mongo.Collection<SettingMetaOptional, SettingMeta>(
	'settings'
);

export type Setting = {
	key: NestedKeyOf<typeof _defaultSettings>;
	value: any;
	userId?: string;
};
export type SettingMeta = WithMetaFields<Setting>;
export type SettingMetaOptional = WithOptionalMetaFields<Setting>;
