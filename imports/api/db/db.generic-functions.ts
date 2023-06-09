import { Mongo } from 'meteor/mongo';

// ---

export async function insert<T>(
	collection: MeteorMongoCollection<T>,
	document: WithOptionalMetaFields<T>
) {
	const timestamp = new Date();

	const documentWithMetaFields = {
		...document,
		createdAt: timestamp,
		updatedAt: timestamp,
		...(document.userId ? { createdBy: document.userId, updatedBy: document.userId } : {}),
	};

	// @ts-ignore --> This is not ideal
	return await collection.insertAsync(documentWithMetaFields);
}

export async function update<T>(
	collection: MeteorMongoCollection<T>,
	selector: MeteorMongoSelector<T>,
	modifier: UpdateModifier<WithOptionalMetaFields<T>>,
	userId: string,
	options: UpdateOptions = {}
) {
	const timestamp = new Date();

	const updateWithMetaFields = {
		...modifier,
		$set: {
			...(modifier.$set ? modifier.$set : {}),
			updatedAt: timestamp,
			updatedBy: userId,
		},
	};

	// @ts-ignore --> This is not ideal
	return await collection.updateAsync(selector, updateWithMetaFields, options);
}

export async function remove<T>(
	collection: MeteorMongoCollection<T>,
	selector: MeteorMongoSelector<T>,
	userId: string
) {
	const timestamp = new Date();

	const documentWithMetaFields = {
		deletedAt: timestamp,
		deletedBy: userId,
	};

	return await collection.updateAsync(
		selector,
		// @ts-ignore --> This is not ideal
		{ $set: documentWithMetaFields },
		{ multi: true }
	);
}

export function find<T>(
	collection: MeteorMongoCollection<T>,
	selector: MeteorMongoSelector<T>,
	options: FindOptions = {}
) {
	const newSelector = {
		...selector,
		deletedAt: { $exists: false },
	};
	return collection.find(newSelector, options);
}

export async function findOne<T>(
	collection: MeteorMongoCollection<T>,
	selector: MeteorMongoSelector<T>,
	options: FindOptions = {}
) {
	const newSelector = {
		...selector,
		deletedAt: { $exists: false },
	};
	return await collection.findOneAsync(newSelector, options);
}

type MetaFields = {
	_id: string;
	userId?: string;
	createdAt: Date;
	createdBy: string;
	updatedAt: Date;
	updatedBy: string;
	deletedAt?: Date;
	deletedBy?: string;
};

export type MeteorMongoCollection<T> = Mongo.Collection<
	WithOptionalMetaFields<T>,
	WithMetaFields<T>
>;
export type MeteorMongoSelector<T> = Mongo.Selector<WithOptionalMetaFields<T>>;

export type WithMetaFields<T> = T & MetaFields;
export type WithOptionalMetaFields<T> = Omit<T, keyof MetaFields> &
	Partial<Pick<T & MetaFields, keyof MetaFields>>;

/* The following types are copied from meteor/mongo because unfortunately the types are not exported from the package, so they can't be used directly. Some types are slightly simplified. Some types are also available in the mongodb Node.js driver package, but that package does not work on the client, and these methods will be used on the server and client. */
export type UpdateModifier<T> = {
	$currentDate?:
		| (Partial<Record<keyof T, CurrentDateModifier>> & Dictionary<CurrentDateModifier>)
		| undefined;
	$inc?: (PartialMapTo<T, number> & Dictionary<number>) | undefined;
	$min?: (PartialMapTo<T, Date | number> & Dictionary<Date | number>) | undefined;
	$max?: (PartialMapTo<T, Date | number> & Dictionary<Date | number>) | undefined;
	$mul?: (PartialMapTo<T, number> & Dictionary<number>) | undefined;
	$rename?: (PartialMapTo<T, string> & Dictionary<string>) | undefined;
	$set?: (Partial<T> & Dictionary<any>) | undefined;
	$setOnInsert?: (Partial<T> & Dictionary<any>) | undefined;
	$unset?: (PartialMapTo<T, string | boolean | 1 | 0> & Dictionary<any>) | undefined;
	$addToSet?: (ArraysOrEach<T> & Dictionary<any>) | undefined;
	$push?: (PushModifier<T> & Dictionary<any>) | undefined;
	$pull?: (ElementsOf<T> & Dictionary<any>) | undefined;
	$pullAll?: (Partial<T> & Dictionary<any>) | undefined;
	$pop?: (PartialMapTo<T, 1 | -1> & Dictionary<1 | -1>) | undefined;
};

export type FindOptions = {
	/** Sort order (default: natural order) */
	sort?: Record<string, any> | undefined;
	/** Number of results to skip at the beginning */
	skip?: number | undefined;
	/** Maximum number of results to return */
	limit?: number | undefined;
	/** Dictionary of fields to return or exclude. */
	fields?: { [id: string]: number } | undefined;
	/** (Server only) Overrides MongoDB's default index selection and query optimization process. Specify an index to force its use, either by its name or index specification. */
	hint?: string | Document | undefined;
	/** (Client only) Default `true`; pass `false` to disable reactivity */
	reactive?: boolean | undefined;
	// transform() was removed because
};

export type UpdateOptions = {
	/** True to modify all matching documents; false to only modify one of the matching documents (the default). */
	multi?: boolean | undefined;
	/** True to insert a document if no matching documents are found. */
	upsert?: boolean | undefined;
	/**
	 * Used in combination with MongoDB [filtered positional operator](https://docs.mongodb.com/manual/reference/operator/update/positional-filtered/) to specify which elements to
	 * modify in an array field.
	 */
	arrayFilters?: { [identifier: string]: any }[] | undefined;
};

type CurrentDateModifier = { $type: 'timestamp' | 'date' } | true;

type Dictionary<T> = { [key: string]: T };

type PartialMapTo<T, M> = Partial<Record<keyof T, M>>;

type ArraysOrEach<T> = {
	[P in keyof T]?: OnlyElementsOfArrays<T[P]> | { $each: T[P] };
};

type OnlyElementsOfArrays<T> = T extends any[] ? Partial<T[0]> : never;

type PushModifier<T> = {
	[P in keyof T]?:
		| OnlyElementsOfArrays<T[P]>
		| {
				$each?: T[P] | undefined;
				$position?: number | undefined;
				$slice?: number | undefined;
				$sort?: 1 | -1 | Dictionary<number> | undefined;
		  };
};

type ElementsOf<T> = {
	[P in keyof T]?: OnlyElementsOfArrays<T[P]>;
};
