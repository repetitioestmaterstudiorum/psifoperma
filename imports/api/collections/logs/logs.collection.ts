import { Mongo } from 'meteor/mongo';
import { WithOptionalMetaFields, WithMetaFields } from '../../db/db.generic-functions';
import { C } from '/imports/startup/global.constants';

// ---

export const LogsCollection = new Mongo.Collection<LogMetaOptional, LogMeta>('logs');

export type Log = {
	text: string;
	data?: any;
	severity?: 'info' | 'error';
	timestamp: Date;
	hostname: string;
	env: string;
};
export type LogMeta = WithMetaFields<Log>;
export type LogMetaOptional = WithOptionalMetaFields<Log>;

if (C.app.isServer) {
	LogsCollection.createIndexAsync({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });
	LogsCollection.createIndexAsync({ timestamp: 1 });
	LogsCollection.createIndexAsync({ env: 1 });
	LogsCollection.createIndexAsync({ severity: 1 });
}
