const Duel = require('../models/Duel');
const Player = require('../models/Player');
const Character = require('../models/Character');
const { simulateFight } = require('../utils/fightLogic');
const { Connection, Keypair, Transaction, SystemProgram, PublicKey } = require('@solana/web3.js');
const anchor = require('@project-serum/anchor');

const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

// Create AI Duel
exports.createAiDuel = async (req, res) => {
    const { creatorAddress, creatorWarriors, difficulty } = req.body;

    if (creatorWarriors.length < 3) {
        return res.status(400).json({ message: 'Player must present at least 3 characters for each battle!' });
    }

    const newDuel = new Duel({
        duelId: await Duel.countDocuments() + 1,
        isActive: true,
        isCompleted: false,
        difficulty,
        duelCreator: creatorAddress,
        creatorWarriors,
        opponentWarriors: [],
        creationTime: Date.now(),
    });

    await newDuel.save();

        // Create duel on Solana
        const creator = await Player.findById(duelCreator);
        const opponent = await Player.findById(opponentId);
        const payer = Keypair.fromSecretKey(/* your secret key here */); // Load payer keypair

        // Generate a new public key for the duel account
        const duelAccount = Keypair.generate();

        // Create transaction
        const transaction = new Transaction().add(
            SystemProgram.createAccount({
                fromPubkey: payer.publicKey,
                newAccountPubkey: duelAccount.publicKey,
                lamports: await connection.getMinimumBalanceForRentExemption(8), // Size of the account data
                space: 8, // Adjust according to your duel layout size
                programId: new PublicKey("YourProgramID"),
            }),
            // Call the create_duel function in your Solana program
            anchor.web3.AnchorProgram.createDuel({
                accounts: {
                    duel: duelAccount.publicKey,
                    payer: payer.publicKey,
                    systemProgram: SystemProgram.programId,
                },
                data: {
                    creator: creator.address,
                    opponent: opponent.address
                },
            })
        );

        // Sign transaction
        transaction.feePayer = payer.publicKey;
        await transaction.sign([payer, duelAccount]);

        // Send transaction
        const signature = await connection.sendTransaction(transaction, [payer, duelAccount]);
        await connection.confirmTransaction(signature);

    res.status(201).json(newDuel);
};

// Select strategy for AI duel
exports.selectAiBattleStrategy = async (req, res) => {
    const { duelId, walletAddress, strategy } = req.body;
    
    const duel = await Duel.findOne({ duelId });
    if (!duel) return res.status(404).json({ message: 'Duel not found' });

    // Implement strategy selection logic
    duel.creatorsStrategy = strategy; // This should include strategy logic.
    
    await duel.save();
    res.json(duel);
};

// Fight in the duel
exports.fightDuel = async (req, res) => {
    const { duelId } = req.params;
    const duel = await Duel.findOne({ duelId });

    if (!duel) return res.status(404).json({ message: 'Duel not found' });

    const result = simulateFight(duel.creatorWarriors, duel.opponentWarriors, allCharacters);
    
    // Save the result and update the duel
    duel.isCompleted = true; // Example
    duel.winner = result.winner; // Set the winner from fight logic
    await duel.save();
    res.json(duel);
};

exports.fetchDuels = async (req, res) => {
    const { id } = req.params;
    try {
        const duels = id ? await Duel.findById(id).populate('creator opponent') : await Duel.find().populate('creator opponent');
        res.json(duels);
    } catch (error) {
        res.status(500).send(error);
    }
};


exports.fetchAvailableDuels = async (req, res) => {
    try {
        const availableDuels = await Duel.find({ status: 'Pending'}).populate('creator opponent');
        res.json(availableDuels);
    } catch (error) {
        res.status(500).send(error);
    }
};