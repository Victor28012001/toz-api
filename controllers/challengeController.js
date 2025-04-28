const Challenge = require('../models/challenge');
const Character = require('../models/Character');
const Player = require('../models/Player');
const { AllStrategies, decodeStrategy, decideVictim } = require('../utils/strategies');
const { Connection, Keypair, Transaction } = require('@solana/web3.js');
const anchor = require('@project-serum/anchor');

const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

// Create Challenge
exports.createChallenge = async (req, res) => {
    const { creatorAddress, creatorWarriors, hasStake, stakeAmount, timestamp } = req.body;

    if (creatorWarriors.length < 3) {
        return res.status(400).json({ message: 'Player must present at least 3 characters for each battle!' });
    }
    if (!hasStake && stakeAmount > 0) {
        return res.status(400).json({ message: 'Stake amount must be 0 if stake is deactivated' });
    }

    const totalChallenges = await Challenge.countDocuments();
    const newChallenge = new Challenge({
        ChallengeId: totalChallenges + 1,
        isActive: false,
        isCompleted: false,
        hasStake,
        stakeAmount,
        difficulty: 'P2P',
        ChallengeCreator: creatorAddress,
        creatorWarriors,
        ChallengeOpponent: '',
        opponentWarriors: [],
        battleLog: [],
        ChallengeWinner: '',
        ChallengeLoser: '',
        creationTime: timestamp,
    });

    if (hasStake) {
        await enforceStake(creatorAddress, stakeAmount);
    }

    await newChallenge.save();


        // Create duel on Solana
        const creator = await Player.findById(creatorId);
        const opponent = await Player.findById(opponentId);
        const payer = Keypair.fromSecretKey(/* your secret key here */);

        // Create transaction
        const transaction = new Transaction().add(
            anchor.web3.SystemProgram.createAccount({
                fromPubkey: payer.publicKey,
                newAccountPubkey: new PublicKey(/* generate new duel account key */),
                lamports: await connection.getMinimumBalanceForRentExemption(DuelLayout.span),
                space: DuelLayout.span,
                programId: new PublicKey("YourProgramID"),
            }),
            anchor.web3.programs.system.createDuel({
                creator: creator.address,
                opponent: opponent.address
            })
        );

        // Send transaction
        const signature = await connection.sendTransaction(transaction, [payer]);
        await connection.confirmTransaction(signature);


    res.status(201).json(newChallenge);
};

// Enforce Stake
const enforceStake = async (userAddress, stakeAmount) => {
    const player = await Player.findOne({ walletAddress: userAddress });
    if (player && player.cartesiTokenBalance >= stakeAmount) {
        player.cartesiTokenBalance -= stakeAmount;
        await player.save();
    } else {
        throw new Error('Not enough balance to stake');
    }
};

// Join Challenge
exports.joinChallenge = async (req, res) => {
    const { ChallengeId, opponentAddress, opponentWarriors } = req.body;

    const Challenge = await Challenge.findOne({ ChallengeId });
    if (!Challenge) {
        return res.status(404).json({ message: `Challenge with id ${ChallengeId} not found` });
    }
    if (Challenge.isActive) {
        return res.status(400).json({ message: 'Challenge already active' });
    }
    if (Challenge.isCompleted) {
        return res.status(400).json({ message: 'Challenge already completed' });
    }
    if (opponentWarriors.length !== 3) {
        return res.status(400).json({ message: 'Player must present exactly 3 characters for each battle!' });
    }
    if (Challenge.ChallengeCreator === opponentAddress) {
        return res.status(400).json({ message: 'You cannot join your own Challenge' });
    }

    if (Challenge.hasStake) {
        await enforceStake(opponentAddress, Challenge.stakeAmount);
    }

    Challenge.ChallengeOpponent = opponentAddress;
    Challenge.opponentWarriors = opponentWarriors;
    Challenge.isActive = true;
    await Challenge.save();

    res.status(200).json(Challenge);
};

// Set Strategy
exports.setStrategy = async (req, res) => {
    const { ChallengeId, walletAddress, strategy } = req.body;

    const Challenge = await Challenge.findOne({ ChallengeId });
    if (!Challenge) {
        return res.status(404).json({ message: `Challenge with id ${ChallengeId} not found` });
    }
    if (!Challenge.isActive) {
        return res.status(400).json({ message: 'Challenge not active' });
    }
    if (Challenge.isCompleted) {
        return res.status(400).json({ message: 'Challenge already completed' });
    }

    if (Challenge.ChallengeCreator === walletAddress) {
        Challenge.creatorsStrategy = strategy;
    } else if (Challenge.ChallengeOpponent === walletAddress) {
        Challenge.opponentsStrategy = strategy;
    } else {
        return res.status(400).json({ message: 'You are not the creator or opponent of this Challenge' });
    }

    await Challenge.save();
    res.status(200).json(Challenge);
};

// Fight
exports.fight = async (req, res) => {
    const { ChallengeId } = req.body;

    const Challenge = await Challenge.findOne({ ChallengeId });
    if (!Challenge) {
        return res.status(404).json({ message: `Challenge with id ${ChallengeId} not found` });
    }
    if (!Challenge.isActive) {
        return res.status(400).json({ message: 'Challenge not active' });
    }
    if (Challenge.isCompleted) {
        return res.status(400).json({ message: 'Challenge already completed' });
    }
    if (Challenge.creatorsStrategy === 'YetToSelect' || Challenge.opponentsStrategy === 'YetToSelect') {
        return res.status(400).json({ message: 'Strategy not selected' });
    }

    let creatorWarriors = await Character.find({ id: { $in: Challenge.creatorWarriors } });
    let opponentWarriors = await Character.find({ id: { $in: Challenge.opponentWarriors } });

    while (creatorWarriors.length > 0 && opponentWarriors.length > 0) {
        // Simulate attack
        const creatorAttack = creatorWarriors[0]; // Assuming first warrior attacks
        const opponentAttack = opponentWarriors[0]; // Assuming first warrior defends

        // Attack logic
        let damage = creatorAttack.strength + (creatorAttack.attack / 2) - (opponentAttack.speed / 4);
        opponentAttack.health = Math.max(0, opponentAttack.health - damage);
        Challenge.battleLog.push({ attacker: creatorAttack.id, opponent: opponentAttack.id, damage });

        if (opponentAttack.health === 0) {
            opponentWarriors.shift(); // Remove dead warrior
        }

        // Check if opponent is defeated
        if (opponentWarriors.length === 0) {
            Challenge.ChallengeWinner = Challenge.ChallengeCreator;
            Challenge.ChallengeLoser = Challenge.ChallengeOpponent;
            Challenge.isCompleted = true;
            await Challenge.save();
            return res.status(200).json(Challenge);
        }

        // Opponent attacks
        const opponentDamage = opponentAttack.strength + (opponentAttack.attack / 2) - (creatorAttack.speed / 4);
        creatorAttack.health = Math.max(0, creatorAttack.health - opponentDamage);
        Challenge.battleLog.push({ attacker: opponentAttack.id, opponent: creatorAttack.id, damage: opponentDamage });

        if (creatorAttack.health === 0) {
            creatorWarriors.shift(); // Remove dead warrior
        }

        // Check if creator is defeated
        if (creatorWarriors.length === 0) {
            Challenge.ChallengeWinner = Challenge.ChallengeOpponent;
            Challenge.ChallengeLoser = Challenge.ChallengeCreator;
            Challenge.isCompleted = true;
            await Challenge.save();
            return res.status(200).json(Challenge);
        }
    }

    await Challenge.save();
    res.status(200).json(Challenge);
};

// Utility functions (if needed)

exports.fetchChallenges = async (req, res) => {
    const { id } = req.params;
    try {
        const Challenges = id ? await Challenge.findById(id) : await Challenge.find();
        res.json(Challenges);
    } catch (error) {
        res.status(500).send(error);
    }
};