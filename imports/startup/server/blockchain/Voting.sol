// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0 <0.9.0;

contract Voting {
    struct Voter {
        bool isVoter;
        bool voted;
        uint vote;
    }

    struct Proposal {
        uint voteCount;
        string title;
    }

    struct VotingInstance {
        mapping(address => Voter) voters;
        Proposal[] proposals;
        uint deadline;
        address ownerAddress;
    }

    event VotingInstanceInitialized(uint indexed instanceId);
    event VotingInstanceBasePropsSet(uint deadline);
    event ProposalAdded(uint indexed proposalId, string title);
    event VoterAdded(address indexed voter);

    // Events simplifying node.js integration
    event RETcreateVoting(uint indexed instanceId, uint deadline, address indexed ownerAddress);
    event RETvote(address indexed voterAddress, uint indexed instanceId, uint indexed proposalId);
    event RETgetInstance(uint proposalsCount, uint deadline, address ownerAddress);
    event RETgetInstanceProposal(uint voteCount, string title);
    event RETgetInstanceVoter(bool isVoter, bool voted, uint vote);
    event RETgetInstancesCount(uint count);

    VotingInstance[] public votingInstances;

    function createVoting(address[] memory voterAddresses, string[] memory proposalTitles, uint durationInMinutes) public returns (uint, uint, address) {
        // Gas safeguards to avoid infinite loops
        require(voterAddresses.length <= 1000, "Too many voters");
        require(proposalTitles.length <= 50, "Too many proposals");

        // Get ID, add space in votingInstances, get instance
        uint instanceId = votingInstances.length;
        votingInstances.push(); 
        VotingInstance storage newInstance = votingInstances[instanceId];
        emit VotingInstanceInitialized(instanceId);

        // Set base properties of the new instance
        newInstance.deadline = block.timestamp + durationInMinutes * 1 minutes;
        newInstance.ownerAddress = msg.sender;
        emit VotingInstanceBasePropsSet(newInstance.deadline);

        // Add proposals
        for (uint i = 0; i < proposalTitles.length; i++) {
            newInstance.proposals.push(Proposal(0, proposalTitles[i]));
            emit ProposalAdded(i, proposalTitles[i]);
        }

        // Add voterAddresses
        for(uint i = 0; i < voterAddresses.length; i++) {
            newInstance.voters[voterAddresses[i]] = Voter(true, false, 0);
            emit VoterAdded(voterAddresses[i]);
        }

        emit RETcreateVoting(instanceId, newInstance.deadline, msg.sender);
        return (instanceId, newInstance.deadline, msg.sender);
    }

    function vote(uint instanceId, uint proposalId, address voterAddress) public returns (address, uint, uint) {
        require(instanceId < votingInstances.length, "Voting instance does not exist");
        require(block.timestamp < votingInstances[instanceId].deadline, "Voting deadline passed");
        require(msg.sender == votingInstances[instanceId].ownerAddress || msg.sender == voterAddress, "Only the owner or the voter can cast a vote");
        require(proposalId < votingInstances[instanceId].proposals.length, "Proposal does not exist");

        Voter storage voter = votingInstances[instanceId].voters[voterAddress];
        require(voter.isVoter, "Has no voting rights");
        require(!voter.voted, "Already voted");

        voter.voted = true;
        voter.vote = proposalId;

        votingInstances[instanceId].proposals[proposalId].voteCount += 1;
        emit RETvote(voterAddress, instanceId, proposalId);
        return (voterAddress, instanceId, proposalId);
    }

    function getInstance(uint instanceId) public returns (uint, uint, address) {
        require(instanceId < votingInstances.length, "Voting instance does not exist");

        VotingInstance storage instance = votingInstances[instanceId];

        emit RETgetInstance(instance.proposals.length, instance.deadline, instance.ownerAddress);
        return (instance.proposals.length, instance.deadline, instance.ownerAddress);
    }

    function getInstanceProposal(uint instanceId, uint proposalId) public returns (uint, string memory) {
        require(instanceId < votingInstances.length, "Voting instance does not exist");
        require(proposalId < votingInstances[instanceId].proposals.length, "Proposal does not exist");

        Proposal storage proposal = votingInstances[instanceId].proposals[proposalId];

        emit RETgetInstanceProposal(proposal.voteCount, proposal.title);
        return (proposal.voteCount, proposal.title);
    }

    function getInstanceVoter(uint instanceId, address voterAddress) public returns (bool, bool, uint) {
        require(instanceId < votingInstances.length, "Voting instance does not exist");

        Voter storage voter = votingInstances[instanceId].voters[voterAddress];

        emit RETgetInstanceVoter(voter.isVoter, voter.voted, voter.vote);
        return (voter.isVoter, voter.voted, voter.vote);
    }

    function getInstancesCount() public returns (uint) {
        emit RETgetInstancesCount(votingInstances.length);
        return votingInstances.length;
    }
}
