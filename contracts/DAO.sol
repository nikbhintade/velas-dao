//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";


contract DAO {
    //TODO 1: Create Proposal struct
    
    enum Option { Approve, Deny }
    enum Status { Approved, Denied, InProgress, Expired}

    struct Proposal {
        address proposer;
        string name;
        uint256 votesForApprove;
        uint256 votesForDeny;
        uint256 startTime;
        uint256 votingPeriod;
        Status status;
    }

    //TODO 2: Track proposals with mapping

    mapping(uint256 => Proposal) public proposals;

    //TODO 3: Track votes with mapping

    mapping(address => mapping(uint256 => bool)) public voted;

    IERC20 public governancetoken;
    uint256 public indx;
    uint256 constant public VOTING_PERIOD = 7 days;

    //TODO 4: construtor with input of governance token

    constructor(address _governancetoken) {
        governancetoken = IERC20(_governancetoken);
    }
    
    //TODO 5: CreateProposal function
    
    function createProposal(string memory _name) public isMember returns(Proposal memory) {

        proposals[indx] = Proposal(
            msg.sender,
            _name,
            0,
            0,
            block.timestamp,
            VOTING_PERIOD,
            Status.InProgress
        );

        indx++;

        return proposals[indx-1];
    }
    
    //TODO 6: Vote function
    
    function vote(uint256 _proposal, Option _vote) public isMember {
        Proposal storage proposal = proposals[_proposal];
        require(proposal.startTime + VOTING_PERIOD >= block.timestamp, "Voting Ended");
        require(voted[msg.sender][_proposal] == false, "Already Voted!");
        
        uint256 balance = governancetoken.balanceOf(msg.sender);

        if (_vote == Option.Approve) {
            proposal.votesForApprove = proposal.votesForApprove + balance;
        } else {
            proposal.votesForDeny = proposal.votesForDeny + balance;
        }

        voted[msg.sender][_proposal] = true;
    }

    //TODO 7: Check Status of the proposal
    
    function updateStatus(uint256 _proposal) public returns(Status){
        Proposal storage proposal = proposals[_proposal];
        require(proposal.startTime + VOTING_PERIOD <= block.timestamp, "Voting In Progress");
        uint256 halfOfSupply = governancetoken.totalSupply() / 2;

        if (proposal.votesForApprove > halfOfSupply) {
            proposal.status = Status.Approved;
        } else if (proposal.votesForDeny > halfOfSupply) {
            proposal.status = Status.Denied;
        } else {
            proposal.status = Status.Expired;
        }

        return proposal.status;
    }

    //TODO : create modifier for checking if address holds governance token
    modifier isMember {
        uint256 balance = governancetoken.balanceOf(msg.sender);
        require(balance > 0, "Not a member of quorum");
        _;
    }
}
