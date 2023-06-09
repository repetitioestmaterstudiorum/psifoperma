import _ from 'lodash';

// ---

export function generateRandomName() {
	const adjectives = [
		'spicy',
		'chromatic',
		'ancient',
		'fast',
		'adorable',
		'brave',
		'clever',
		'eager',
	];
	const nouns = [
		'dinosaur',
		'rainbow',
		'penguin',
		'tree',
		'unicorn',
		'ocean',
		'elephant',
		'butterfly',
	];

	const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
	const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];

	return _.startCase(`${randomAdjective} ${randomNoun}`);
}
