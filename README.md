# Psifoperma

Simple blockchain voting app and final project for the blockchain course at HSLU (hslu.ch).

## Project Description

Psifoperma is an invented word: a derivation of the Greek word psifos (EN: vote) and perma for permanence.

The goal is to build a voting/survey system for clubs and small companies, using the ERC-20 token standard on the Ethereum blockchain. Developed with MeteorJS, it offers secure and tamper-proof voting records, immutability, transparency, and pseudonymity. Users can create votes and invite voters, voters can easily cast votes, and both users and voters can view the results.

![Vote Overview](./_assets/vote-overview.png)
_Figure 1: Vote Overview_

The main benefit of using a blockchain for this use case is that it is publicly verifiable how many votes were cast and what the result of a vote is.

![Vote View](./_assets/vote-view.png)
_Figure 2: Vote View_

The app provides direct links to Etherscan. The deployed smart contract can also be used directly, without our application. Furthermore, the contract technically already allows voters to vote directly (either the vote creater or the voter can cast a vote for the voter).

## Future Work

The final phase of the project was a bit rushed, due to time constraints. Lots of additional work could be done.

The following is a list of nice to haves, in case this project would be developed further.

-   [x] Input validation
-   [ ] Client-side address generation
-   [ ] Client-side voting using Metamask
-   [ ] Eliminate the voter role, it's not really needed, or create a mechanism for voters to become users (so they can create votes themselves)
-   [ ] Schema validation
-   [ ] Add DDP rate limit for all methods (only some have it so far)
-   [ ] Add indicator on votes view if user has edit rights
-   [ ] Add indicator on votes view if user has voted
-   [ ] Follow the Meteor Seucirty Checklist
-   [ ] Remove instances of window.location.reload()
-   [ ] Get rid of alanning:roles
-   [ ] Remove local contract deployment logic and voting state changes (instead, use a local Ganache instance that preserves state)
-   [ ] Add tests for most important functionality

## Learn About Blockchain

https://blockchainworkbench.com/

## Using This Repo

-   Git clone the project
-   Install MeteorJS: https://docs.meteor.com/install.html
-   `meteor npm i`
-   `npm run dev`

### Updating Packages

-   Meteor: `meteor update`
-   NPM: `npx npm-check-updates -u` and then `npm install`
