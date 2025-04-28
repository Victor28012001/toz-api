const Transactions = require("../models/Transaction");
const OwnershipHistory = require("../models/ownershipHistory");
const {
  Connection,
  PublicKey,
  clusterApiUrl,
  Transaction,
  SystemProgram,
  Keypair,
} = require("@solana/web3.js");
const {
  getAccount,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} = require("@solana/spl-token");

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

// Record a new transaction
exports.recordTransaction = async (req, res) => {
  const { tx_id, method, caller, status } = req.body;
  const newTransaction = new Transactions({ tx_id, method, caller, status });
  try {
    await newTransaction.save();
    res.status(201).json(newTransaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all transactions
exports.getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transactions.find();
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get transaction by ID
exports.getTransactionById = async (req, res) => {
  const { id } = req.params;
  try {
    const transaction = await Transactions.findById(id);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    res.status(200).json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a transaction
exports.deleteTransaction = async (req, res) => {
  const { id } = req.params;
  try {
    const transaction = await Transactions.findByIdAndDelete(id);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.withdrawJuksbucks = async (req, res) => {
  const { walletAddress, amount } = req.body;

  // Logic to deduct Juksbucks from the player
  try {
    const player = await player.findOne({ walletAddress });
    if (!player) return res.status(404).send("Player not found");

    if (player.juksbucksBalance < amount) {
      return res.status(400).send("Insufficient balance");
    }

    const payer = Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(process.env.PLAYER_SECRET_KEY))
    );
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: new PublicKey(walletAddress),
        toPubkey: payer.publicKey,
        lamports: amount * LAMPORTS_PER_SOL, // Assuming Juksbucks is 1:1 with SOL
      })
    );

    transaction.feePayer = payer.publicKey;
    await transaction.recentBlockhash;
    await transaction.sign(payer);

    const signature = await connection.sendTransaction(transaction, [payer]);
    await connection.confirmTransaction(signature);

    // Validate the transaction with the provided signature
    const validationResult = await validateTransactions(signature); // Call validateTransactions
    if (!validationResult.success) {
      return res
        .status(400)
        .send("Transaction validation failed: " + validationResult.message);
    }

    player.juksbucksBalance -= amount;
    await player.save();

    // Log transaction
    const transactionLog = new Transactions({
      tx_id: generateTransactionId(),
      method: "withdrawal",
      caller: walletAddress,
      status: "Success",
      amount,
    });
    await transactionLog.save();

    res
      .status(200)
      .json({
        message: "Withdrawal successful",
        balance: player.juksbucksBalance,
      });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.depositJuksbucks = async (req, res) => {
  const { walletAddress, amount } = req.body;

  try {
    const player = await player.findOne({ walletAddress });
    if (!player) return res.status(404).send("Player not found");

    const payer = Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(process.env.PLAYER_SECRET_KEY))
    );
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: payer.publicKey,
        toPubkey: new PublicKey(walletAddress),
        lamports: amount * LAMPORTS_PER_SOL, // Assuming Juksbucks is 1:1 with SOL
      })
    );

    transaction.feePayer = payer.publicKey;
    await transaction.recentBlockhash;
    await transaction.sign(payer);

    const signature = await connection.sendTransaction(transaction, [payer]);
    await connection.confirmTransaction(signature);

    // Validate the transaction with the provided signature
    const validationResult = await validateTransactions(signature); // Call validateTransactions
    if (!validationResult.success) {
      return res
        .status(400)
        .send("Transaction validation failed: " + validationResult.message);
    }

    player.juksbucksBalance += amount;
    await player.save();

    // Log transaction
    const transactionLog = new Transactions({
      tx_id: generateTransactionId(),
      method: "deposit",
      caller: walletAddress,
      status: "Success",
      amount,
    });
    await transactionLog.save();

    res
      .status(200)
      .json({
        message: "Deposit successful",
        balance: player.juksbucksBalance,
      });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.transferNFT = async (req, res) => {
  const { fromWallet, toWallet, nftId } = req.body;

  try {
    const fromPlayer = await toPlayer.findOne({ walletAddress: fromWallet });
    const toPlayer = await toPlayer.findOne({ walletAddress: toWallet });

    if (!fromPlayer || !toPlayer) {
      return res.status(404).send("One or both players not found");
    }

    const character = await character.findById(nftId);
    if (
      !character ||
      character.owner.toString() !== fromPlayer._id.toString()
    ) {
      return res.status(400).send("Character not found or not owned by sender");
    }

    // Here is where you create the transaction to transfer the NFT
    const payer = Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(process.env.PLAYER_SECRET_KEY))
    ); // Load the payer's secret key
    const transaction = new Transaction().add(
      // Create your transfer instructions here
      // Example: Transfer character's token account
      SystemProgram.transfer({
        fromPubkey: new PublicKey(fromWallet),
        toPubkey: new PublicKey(toWallet),
        lamports: 1,
      })
    );

    // Set the fee payer
    transaction.feePayer = payer.publicKey;
    await transaction.recentBlockhash; // You may need to set the recent blockhash

    // Sign the transaction
    await transaction.sign(payer);

    // Send the transaction
    const signature = await connection.sendTransaction(transaction, [payer]);
    await connection.confirmTransaction(signature);

    // Validate the transaction with the provided signature
    const validationResult = await validateTransactions(signature); // Call validateTransactions
    if (!validationResult.success) {
      return res
        .status(400)
        .send("Transaction validation failed: " + validationResult.message);
    }

    // Transfer ownership
    character.owner = toPlayer._id;
    await character.save();

    // Log the transfer activity
    const activity = new PlayerActivity({
      player: fromPlayer._id,
      activityType: "transfer_nft",
      description: `Player ${fromPlayer.walletAddress} transferred NFT ${nftId} to ${toPlayer.walletAddress}.`,
      metadata: { nftId, toPlayerId: toPlayer._id },
    });
    await activity.save();

    // Log transaction
    const transactionLog = new Transactions({
      tx_id: generateTransactionId(),
      method: "transferNFT",
      caller: fromWallet,
      status: "Success",
      nftId: character._id,
    });
    await transactionLog.save();

    const ownershipHistory = new OwnershipHistory({
      nftId: character._id,
      previousOwner: fromWallet,
      newOwner: toPlayer._id,
    });

    await ownershipHistory.save();

    // Update players' characters
    fromPlayer.characters = fromPlayer.characters.filter(
      (char) => char.toString() !== nftId
    );
    toPlayer.characters.push(character._id);
    await fromPlayer.save();
    await toPlayer.save();

    res
      .status(200)
      .json({ message: "NFT transferred successfully", signature, character });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.checkBalance = async (req, res) => {
  const { walletAddress } = req.params;

  try {
    const player = await player.findOne({ walletAddress });
    if (!player) return res.status(404).send("Player not found");

    res.status(200).json({
      message: "Balance fetched successfully",
      juksbucksBalance: player.juksbucksBalance,
      characters: player.characters,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

function generateTransactionId() {
  return Math.floor(Math.random() * 1000000); // Example: random number, you might want a more sophisticated approach
}

// Fetch all transactions
exports.fetchAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find();
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Fetch transactions by caller (wallet address)
exports.fetchTransactionsByCaller = async (req, res) => {
  const { caller } = req.params; // Get wallet address from request parameters
  try {
    const transactions = await Transaction.find({ caller });
    if (transactions.length === 0) {
      return res
        .status(404)
        .json({ message: "No transactions found for this caller" });
    }
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Fetch transactions by method (e.g., deposit, withdrawal, transfer)
exports.fetchTransactionsByMethod = async (req, res) => {
  const { method } = req.params; // Get method from request parameters
  try {
    const transactions = await Transaction.find({ method });
    if (transactions.length === 0) {
      return res
        .status(404)
        .json({ message: "No transactions found for this method" });
    }
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Fetch transactions by status (Success, Failed, Pending)
exports.fetchTransactionsByStatus = async (req, res) => {
  const { status } = req.params; // Get status from request parameters
  try {
    const transactions = await Transaction.find({ status });
    if (transactions.length === 0) {
      return res
        .status(404)
        .json({ message: "No transactions found for this status" });
    }
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Fetch transactions within a date range
exports.fetchTransactionsByDateRange = async (req, res) => {
  const { startDate, endDate } = req.query; // Get start and end date from query parameters
  try {
    const transactions = await Transaction.find({
      timestamp: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    });
    if (transactions.length === 0) {
      return res
        .status(404)
        .json({ message: "No transactions found in this date range" });
    }
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.fetchOwnershipHistory = async (req, res) => {
  const { nftId } = req.params; // Get NFT ID from request parameters

  try {
    const history = await OwnershipHistory.find({ nftId }).populate(
      "nftId",
      "name"
    ); // Populate with character name if needed
    if (!history || history.length === 0) {
      return res
        .status(404)
        .json({ message: "No ownership history found for this NFT" });
    }

    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
