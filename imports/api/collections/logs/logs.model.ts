import { LogMetaOptional, LogsCollection } from '/imports/api/collections/logs/logs.collection';
import { insert } from '/imports/api/db/db.generic-functions';

// ---

export async function insertLog(log: LogMetaOptional): Promise<string> {
	return insert(LogsCollection, log);
}
