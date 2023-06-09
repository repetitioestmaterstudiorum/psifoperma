export function isEmailAValidEmailAddress(email: unknown) {
	if (typeof email !== 'string') return false;
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function encodeEmailInUrl(url: string) {
	const emailInUrlPattern = /selector=([^&]+)/;
	const matches = url.match(emailInUrlPattern); // e.g. ['selector=xyz+1@gmail.com', 'fdsa+1@gmail.com', index: 41, input: 'http://localhost:3000/?loginToken=539B11&selector=fdsa+1@gmail.com', groups: undefined]
	if (!matches) return url;

	const selectorAndEmail = matches[0]; // e.g. selector=fdsa+1@gmail.com
	const encodedSelectorAndEmail = 'selector=' + encodeURIComponent(matches[1]);
	return url.replace(selectorAndEmail, encodedSelectorAndEmail);
}
