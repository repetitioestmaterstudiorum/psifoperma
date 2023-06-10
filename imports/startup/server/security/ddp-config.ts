import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';

// ---

/* These rules are per client 
   https://docs.meteor.com/api/methods.html#ddpratelimiter */

// --- votes methods ----------------------------------------------------------

DDPRateLimiter.addRule(
	{
		type: 'method',
		name: 'votes.insert',
	},
	3,
	1000
); // Allow 3 calls every second

DDPRateLimiter.addRule(
	{
		type: 'method',
		name: 'votes.remove',
	},
	3,
	1000
); // Allow 3 calls every second

DDPRateLimiter.addRule(
	{
		type: 'method',
		name: 'votes.addvoter',
	},
	3,
	1000
); // Allow 3 calls every second

DDPRateLimiter.addRule(
	{
		type: 'method',
		name: 'votes.updateDescription',
	},
	10,
	1000
); // Allow 10 calls every second

DDPRateLimiter.addRule(
	{
		type: 'method',
		name: 'votes.updateTitle',
	},
	10,
	1000
); // Allow 10 calls every second

// --- users methods ----------------------------------------------------------

DDPRateLimiter.addRule(
	{
		type: 'method',
		name: 'users.addVoter',
	},
	1,
	1000
); // Allow 1 call per second

DDPRateLimiter.addRule(
	{
		type: 'method',
		name: 'users.addVoter',
	},
	100,
	3600000
); // Allow 100 calls every 60 minutes

DDPRateLimiter.addRule(
	{
		type: 'method',
		name: 'users.addToRole',
	},
	3,
	5000
); // Allow 3 calls per 5 seconds
