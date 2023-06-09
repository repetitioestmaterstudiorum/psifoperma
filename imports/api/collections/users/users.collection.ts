import {
	MeteorMongoCollection,
	WithMetaFields,
	WithOptionalMetaFields,
} from '/imports/api/db/db.generic-functions';

// ---

export const UsersCollection = Meteor.users as MeteorMongoCollection<User>;

export type User = {
	// Default Meteor fields
	username?: string;
	emails: {
		address: string;
		verified: boolean;
	}[];
	profile: {
		isActive: boolean;
		bcAddress?: string;
		bcPrivateKey?: string;
	};
	services: {
		password: {
			bcrypt: string;
		};
		resume: {
			loginTokens: {
				when: Date;
				hashedToken: string;
			}[];
		};
	};
};
export type UserMeta = WithMetaFields<User>;
export type UserMetaOptional = WithOptionalMetaFields<User>;
