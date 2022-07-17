const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DAO", function () {
  beforeEach(async function () {

    //deploying governance token
    const Gtoken = await ethers.getContractFactory("GovernanceERC20");
    this.gtoken = await Gtoken.deploy(1000);
    await this.gtoken.deployed();

    // distribution of governance token
    this.signers = await ethers.getSigners();

    await this.gtoken.transfer(this.signers[1].address, 333);
    await this.gtoken.transfer(this.signers[2].address, 333);

    //deploying DAO contract
    const DAO = await ethers.getContractFactory("DAO");
    this.dao = await DAO.deploy(this.gtoken.address);
    await this.dao.deployed();

  })

  it("Should revert with not a qourun member", async function () {
    await expect(this.dao.connect(this.signers[3]).createProposal("First Proposal")).to.be.revertedWith("Not a member of quorum");
  })

  it("Should return correct proposal", async function() {
    await this.dao.createProposal('First Proposal');

    expect((await this.dao.proposals(0)).name).to.be.equal('First Proposal');
  })

  it("Should change number of votes correctly", async function() {
    await this.dao.createProposal('First Proposal');

    await this.dao.connect(this.signers[0]).vote(0, 0);
    expect((await this.dao.proposals(0)).votesForApprove).to.be.equal(334);
    
    await this.dao.connect(this.signers[1]).vote(0, 1);
    expect((await this.dao.proposals(0)).votesForDeny).to.be.equal(333);
    
    await expect(this.dao.connect(this.signers[1]).vote(0, 1)).to.be.revertedWith("Already Voted!");
  })

  it("Should not allow to vote after end of voting period", async function() {
    await this.dao.createProposal('First Proposal');
    await ethers.provider.send('evm_increaseTime', [ (7 * 24 * 60 * 60) ]);
    await ethers.provider.send('evm_mine');

    await expect(this.dao.connect(this.signers[2]).vote(0, 1)).to.be.revertedWith("Voting Ended")
  })

  it("Should not allow to update status while voting in progress ", async function() {
    await this.dao.createProposal("First Proposal");
    await ethers.provider.send('evm_increaseTime', [ (7 * 24 * 60 * 60) -60 ]);
    await ethers.provider.send('evm_mine');

    await expect(this.dao.updateStatus(0)).to.be.revertedWith("Voting In Progress");
  })

  it("Should update status to Approved", async function() {
    await this.dao.createProposal("First Proposal");
    
    await this.dao.vote(0, 0);
    await this.dao.connect(this.signers[1]).vote(0, 0);

    await ethers.provider.send('evm_increaseTime', [ (7 * 24 * 60 * 60) ]);
    await ethers.provider.send('evm_mine');

    await this.dao.updateStatus(0);
    const proposal = await this.dao.proposals(0);
    expect(proposal.status).to.be.equal(0);
  })

  it("Should update status to Denied", async function() {
    await this.dao.createProposal("First Proposal");
    
    await this.dao.vote(0, 1);
    await this.dao.connect(this.signers[1]).vote(0, 1);

    await ethers.provider.send('evm_increaseTime', [ (7 * 24 * 60 * 60) ]);
    await ethers.provider.send('evm_mine');

    await this.dao.updateStatus(0);
    const proposal = await this.dao.proposals(0);
    expect(proposal.status).to.be.equal(1);
  })

  it("Should update status to Expired", async function() {
    await this.dao.createProposal("First Proposal");
    await this.dao.vote(0, 0);

    await ethers.provider.send('evm_increaseTime', [ (7 * 24 * 60 * 60) ]);
    await ethers.provider.send('evm_mine');

    await this.dao.updateStatus(0);
    const proposal = await this.dao.proposals(0);
    expect(proposal.status).to.be.equal(3);
  })
});
