const request = require('supertest');
const app = require('../server'); // Replace with the path to your Express app

describe('Player API Tests', () => {
  // Test login endpoint
  it('should log in a player successfully', async () => {
    const res = await request(app)
      .post('/login')
      .send({
        playerId: 'validPlayerId',
        password: 'validPassword',
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token'); // Expect token in response
  });

  it('should fail to log in with invalid credentials', async () => {
    const res = await request(app)
      .post('/login')
      .send({
        playerId: 'invalidPlayerId',
        password: 'invalidPassword',
      });

    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('message', 'Invalid credentials');
  });

  // Test transferNFT endpoint
  it('should transfer an NFT from one player to another', async () => {
    const res = await request(app)
      .post('/transferNFT')
      .send({
        fromWallet: 'validFromWalletAddress',
        toWallet: 'validToWalletAddress',
        nftId: 'validNFTId',
        signature: 'validSignature', // Valid signature expected here
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message', 'NFT transferred successfully');
  });

  it('should fail to transfer NFT if sender does not own the NFT', async () => {
    const res = await request(app)
      .post('/transferNFT')
      .send({
        fromWallet: 'validFromWalletAddress',
        toWallet: 'validToWalletAddress',
        nftId: 'nftNotOwnedBySender',
        signature: 'validSignature',
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('message');
  });

  // Test depositJuksbucks endpoint
  it('should deposit Juksbucks successfully', async () => {
    const res = await request(app)
      .post('/depositJuksbucks')
      .send({
        walletAddress: 'validWalletAddress',
        amount: 100,
        signature: 'validSignature',
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message', 'Juksbucks deposited successfully');
  });

  // Test withdrawJuksbucks endpoint
  it('should withdraw Juksbucks successfully', async () => {
    const res = await request(app)
      .post('/withdrawJuksbucks')
      .send({
        walletAddress: 'validWalletAddress',
        amount: 50,
        signature: 'validSignature',
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message', 'Juksbucks withdrawn successfully');
  });

  // Test adding a friend
  it('should send a friend request successfully', async () => {
    const res = await request(app)
      .post('/addFriend')
      .send({
        fromPlayerId: 'validPlayerId',
        toPlayerId: 'friendPlayerId',
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message', 'Friend request sent successfully');
  });

  // Test removing a friend
  it('should remove a friend successfully', async () => {
    const res = await request(app)
      .post('/removeFriend')
      .send({
        playerId: 'validPlayerId',
        friendId: 'friendPlayerId',
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message', 'Friend removed successfully');
  });

  // Test chat between peers
  it('should send a message between players successfully', async () => {
    const res = await request(app)
      .post('/sendMessage')
      .send({
        fromPlayerId: 'validPlayerId',
        toPlayerId: 'friendPlayerId',
        message: 'Hello, how are you?',
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message', 'Message sent successfully');
  });

  // Test fetching player transactions
  it('should fetch all transactions for a player', async () => {
    const res = await request(app)
      .get('/transactions')
      .query({ walletAddress: 'validWalletAddress' });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('transactions');
  });
});
