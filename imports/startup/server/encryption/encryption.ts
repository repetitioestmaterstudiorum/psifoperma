import * as crypto from 'crypto';
import { C } from '/imports/startup/server/server.constants';

// ---

function generateKeyFromPassword(password: string): Buffer {
	return crypto.createHash('sha256').update(password).digest();
}

export function encrypt(text: string): string {
	const password = C.encryption.pw;
	const key = generateKeyFromPassword(password);
	const iv = crypto.randomBytes(16);
	const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
	let encrypted = cipher.update(text);
	encrypted = Buffer.concat([encrypted, cipher.final()]);
	return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string): string {
	const password = C.encryption.pw;
	const key = generateKeyFromPassword(password);
	const textParts = text.split(':');
	if (textParts.length === 0) {
		throw new Error('Invalid encrypted text');
	}
	const iv = Buffer.from(textParts.shift()!, 'hex');
	if (iv.length !== 16) {
		throw new Error('Invalid IV length');
	}
	const encryptedText = Buffer.from(textParts.join(':'), 'hex');
	const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
	let decrypted = decipher.update(encryptedText);
	decrypted = Buffer.concat([decrypted, decipher.final()]);
	return decrypted.toString();
}
