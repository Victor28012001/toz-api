const { Character } = require("../models/Character");
const Player = require("../models/Player");
const { findById, findOneAndUpdate, findOne } = require("../models/Player");
const { addCharacter } = require("./playerController");
const { transferV1 } = require("@metaplex-foundation/mpl-token-metadata");
const wallet = require("../keypair.json");
const {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  SystemProgram,
} = require("@solana/web3.js");
const {
  Metaplex,
  // keypairIdentity,
  bundlrStorage,
} = require("@metaplex-foundation/js");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

const {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} = require("@solana/spl-token");
const METADATA_PROGRAM_ID = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";
const {
  createNft,
  mplTokenMetadata,
  fetchDigitalAsset,
} = require("@metaplex-foundation/mpl-token-metadata");
const { createUmi } = require("@metaplex-foundation/umi-bundle-defaults");
const {
  createGenericFile,
  createSignerFromKeypair,
  generateSigner,
  keypairIdentity,
  percentAmount,
  sol,
} = require("@metaplex-foundation/umi");
const { mockStorage } = require("@metaplex-foundation/umi-storage-mock");
const { existsSync, readFileSync } = require("fs");

const RPC = "https://api.devnet.solana.com";
const umi = createUmi(RPC);
const creatorWallet = umi.eddsa.createKeypairFromSecretKey(
  new Uint8Array(wallet)
);
const creator = createSignerFromKeypair(umi, creatorWallet);
umi.use(keypairIdentity(creator));
umi.use(mplTokenMetadata());
umi.use(mockStorage());

// const nftDetail = {
//   name: "Epic 3D Sword",
//   symbol: "3DSWD",
//   description: "A beautifully crafted 3D sword for your adventures.",
//   seller_fee_basis_points: 500,
//   image: "https://example.com/images/sword-preview.png",
//   animation_url: "https://example.com/models/sword.glb",
//   external_url: "https://example.com/nft/sword",
//   attributes: [
//     {
//       trait_type: "Material",
//       value: "Steel",
//     },
//     {
//       trait_type: "Length",
//       value: "120cm",
//     },
//     {
//       trait_type: "Rarity",
//       value: "Legendary",
//     },
//     {
//       trait_type: "Weight",
//       value: "2.5kg",
//     },
//   ],
//   properties: {
//     files: [
//       {
//         uri: "https://example.com/models/sword.glb",
//         type: "model/gltf-binary",
//       },
//       {
//         uri: "https://example.com/images/sword-preview.png",
//         type: "image/png",
//       },
//     ],
//     creators: [
//       {
//         address: "3DyOurWaLlETpUBliCKeY123456789",
//         share: 100,
//       },
//     ],
//   },
// };

const uploadToPinata = async (filePath, fileName) => {
  const url = "https://api.pinata.cloud/pinning/pinFileToIPFS";

  try {
    const formData = new FormData();
    formData.append("file", fs.createReadStream(filePath), fileName);

    const response = await axios.post(url, formData, {
      maxContentLength: "Infinity",
      headers: {
        ...formData.getHeaders(),
        pinata_api_key: process.env.PINATA_API_KEY,
        pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY,
      },
    });

    console.log("File uploaded successfully:", response.data);
    return `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
  } catch (error) {
    console.error(
      "Error uploading file to Pinata:",
      error.response?.data || error.message
    );
    throw error;
  }
};

const uploadMetadata = async (nftDetail) => {
  try {
    // Construct files array
    const files = [
      {
        type: "model/gltf-binary",
        uri: `https://aquamarine-working-thrush-698.mypinata.cloud/ipfs/${nftDetail.file_url}`,
      }, // Character Model
      {
        type: nftDetail.imgType,
        uri: `https://aquamarine-working-thrush-698.mypinata.cloud/ipfs/${nftDetail.image}`,
      }, // Character Image
      ...nftDetail.animations.map((anim) => ({
        type: "application/octet-stream",
        uri: `https://aquamarine-working-thrush-698.mypinata.cloud/ipfs/${anim.file_url}`,
        name: anim.name,
      })),
    ];

    const metadata = {
      name: nftDetail.name,
      description: nftDetail.detail,
      image: `https://aquamarine-working-thrush-698.mypinata.cloud/ipfs/${nftDetail.image}`,
      symbol: nftDetail.symbol,
      seller_fee_basis_points: 500,
      attributes: nftDetail.attributes,
      properties: {
        files,
      },
    };

    const metadataFilePath = `metadata_${Date.now()}.json`;
    fs.writeFileSync(
      metadataFilePath,
      JSON.stringify(metadata, null, 2),
      "utf8"
    );

    const metadataUri = await uploadToPinata(
      metadataFilePath,
      `metadata_${Date.now()}.json`
    );
    console.log("Metadata uploaded successfully:", metadataUri);

    fs.unlinkSync(metadataFilePath); // Delete local file after upload
    return metadataUri;
  } catch (error) {
    console.error("Error uploading metadata:", error);
    throw error;
  }
};

async function mintNft(metadataUri, metadata) {
  try {
    const mint = generateSigner(umi);

    console.log("Using metadata URI:", metadataUri);

    await createNft(umi, {
      mint,
      name: metadata.name,
      symbol: metadata.symbol,
      uri: metadataUri, // Use the uploaded metadata URI
      sellerFeeBasisPoints: Math.min(percentAmount(500), 10000),
      creators: [{ address: creator.publicKey, verified: true, share: 100 }],
    }).sendAndConfirm(umi);

    console.log(`Created NFT: ${mint.publicKey.toString()}`);
    return mint.publicKey.toString();
  } catch (error) {
    console.error("Error minting NFT:", error);
    throw error;
  }
}

async function mintCharacterAsNFT(playerWallet, characterData) {
  // Connect to Solana
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  // Generate a new Keypair for the NFT
  const nftMint = Keypair.generate();

  // Create the metadata for the NFT
  const metadata = {
    name: characterData.name,
    symbol: "NFT",
    uri: characterData.avatarUrl, // The URL to the avatar image or model
    seller_fee_basis_points: 500, // Example: 5% fee
    creators: null, // Specify creators if applicable
  };

  // Create the NFT metadata and master edition
  const transaction = new Transaction();
  const metadataTx = await createMetadata({
    connection,
    wallet: playerWallet,
    mint: nftMint.publicKey,
    metadata,
  });

  transaction.add(metadataTx);

  const masterEditionTx = await createMasterEdition({
    connection,
    wallet: playerWallet,
    mint: nftMint.publicKey,
    edition: nftMint.publicKey, // Use mint address for master edition
    metadata: metadataTx,
  });

  transaction.add(masterEditionTx);

  // Send the transaction
  const signature = await connection.sendTransaction(transaction, [nftMint]);

  await connection.confirmTransaction(signature);

  return {
    success: true,
    mintAddress: nftMint.publicKey.toBase58(),
    signature,
  };
}

// exports.fetchPlayerNFTAssets = async (walletAddress) => {
//   try {
//     // Establish connection
//     const connection = new Connection(RPC, "confirmed");
//     const metaplex = Metaplex.make(connection);
//     console.log("walletAddress", walletAddress);

//     // Fetch the player from the database
//     const player = await Player.findOne({
//       walletAddress: walletAddress.toLowerCase(),
//     }).populate("characters"); // Ensure characters are populated
//     console.warn(player?.characters);
//     const chars = player?.characters;

//     // if (!player || !player.characters || player.characters.length === 0) {
//     //   throw new Error("No characters found for the player.");
//     // }

//     // Fetch metadata for each character's mint address
//     const nftAssets = await Promise.all(
//       player?.characters?.map(async (character) => {
//         if (!character.mintAddress) {
//           console.warn(`No mint address found for character: ${character.name}`);
//           return null;
//         }

//         try {
//           // Fetch metadata for the mint address
//           const mintPublicKey = new PublicKey(character.mintAddress);
//           // const nft = await metaplex.nfts().findByMint({ mintAddress: mintPublicKey });
//           const nft = await fetchDigitalAsset(umi, mintPublicKey)

//           // Fetch metadata JSON
//           const metadataUri = nft.uri;
//           const response = await fetch(metadataUri);
//           const metadata = await response.json();

//           return {
//             characterName: character.name,
//             mintAddress: character.mintAddress,
//             imageUrl: metadata.image,
//             gltfUrl: metadata.properties?.files?.find((file) => file.type === "model/gltf+json")?.uri,
//             metadata,
//           };
//         } catch (error) {
//           console.error(`Error fetching NFT for character ${character.name}:`, error);
//           return null;
//         }
//       })
//     );

//     // Filter out null values
//     const validNFTAssets = nftAssets.filter((asset) => asset !== null);

//     return validNFTAssets;
//   } catch (error) {
//     console.error("Error fetching player NFT assets:", error);
//     throw error;
//   }
// };

exports.fetchPlayerNFTAssets = async (walletAddress) => {
  try {
    if (!walletAddress) {
      throw new Error("walletAddress is required but was null or undefined.");
    }

    console.log(
      "fetchPlayerNFTAssets called with walletAddress:",
      walletAddress
    );

    const connection = new Connection(RPC, "confirmed");
    const metaplex = Metaplex.make(connection);

    // Fetch player data
    const player = await Player.findOne({
      walletAddress: walletAddress.toLowerCase(),
    }).populate("characters");

    console.log("Player data:", player);

    if (!player || !player.characters || player.characters.length === 0) {
      throw new Error(
        `No characters found for walletAddress: ${walletAddress}`
      );
    }

    // Deduplicate characters by their mintAddress
    const uniqueCharacters = [
      ...new Map(
        player.characters.map((character) => [character.owner, character])
      ).values(),
    ];

    // Process each character to fetch NFT assets
    const nftAssets = await Promise.all(
      uniqueCharacters.map(async (character) => {
        console.log("Fetching NFT data for character:", character.name);
        if (!character.mintAddress) {
          console.warn(`No mint address for character: ${character.name}`);
          return null; // Skip if no mint address
        }

        try {
          const mintPublicKey = new PublicKey(character.mintAddress);
          const nft = await fetchDigitalAsset(umi, mintPublicKey);
          console.log(nft?.metadata?.uri);

          if (!nft?.metadata?.uri) {
            console.warn(
              `No metadata URI for NFT: ${character.name} (Mint: ${character.mintAddress})`
            );
            return null;
          }

          const response = await fetch(nft?.metadata?.uri);
          const metadata = await response.json();

          // Extract all animation files with .fbx extension
          const animationUrls =
            metadata.properties?.files
              ?.filter(
                (file) =>
                  file.type === "application/octet-stream" ||
                  file.uri.endsWith(".fbx")
              )
              .map((file) => file.uri) || [];

          return {
            characterName: character.name,
            mintAddress: character.mintAddress,
            imageUrl: metadata.image || null,
            gltfUrl:
              metadata.properties?.files?.find(
                (file) => file.type === "model/gltf-binary"
              )?.uri || null,
            animationUrls,
            metadata,
          };
        } catch (error) {
          console.error(
            `Error fetching NFT data for character: ${character.name}`,
            error
          );
          return null; // Skip this character
        }
      })
    );

    // Filter out null assets (failed or skipped characters)
    const filteredAssets = nftAssets.filter((asset) => asset !== null);

    console.log(
      `Successfully fetched ${filteredAssets.length} NFT assets for walletAddress: ${walletAddress}`
    );
    return filteredAssets;
  } catch (error) {
    console.error("Error fetching player NFT assets:", error.message);
    throw error;
  }
};

exports.createCharacter = async (req, res) => {
  const {
    name,
    health,
    strength,
    attack,
    speed,
    super_power,
    price,
    playerId,
    avatarUrl,
    owner,
    mintAddress,
  } = req.body;

  try {
    // Find the player by ID to get the wallet address
    const player = await findById(playerId);
    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }

    const character = new Character({
      name,
      health,
      strength,
      attack,
      speed,
      super_power,
      price,
      playerId,
      avatarUrl,
      owner,
      mintAddress,
    });

    await character.save();

    // Assuming player.walletAddress contains the wallet address
    const playerWallet = player.walletAddress;
    const addCharacterReq = {
      body: { walletAddress: player.walletAddress, characterId: character._id },
    };
    await addCharacter(addCharacterReq, res);

    const result = await mintCharacterAsNFT(playerWallet, character); // Example function for minting

    await Character.create({
      name: character.name,
      avatarUrl: character.avatarUrl,
      health: character.health,
      strength: character.strength,
      attack: character.attack,
      speed: character.speed,
      super_power: character.super_power,
      price: character.price,
      // owner: playerWallet, // Link the NFT to the owner's wallet address
      owner: character.owner, // Link the NFT to the owner's wallet address
      // mintAddress, // Store the mint address of the NFT
      mintAddress: character.mintAddress, // Store the mint address of the NFT
    });

    if (result.success) {
      // Update the player's NFT mint address
      await findOneAndUpdate(
        { walletAddress: playerWallet }, // Find player by wallet address
        { nftMintAddress: result.mintAddress }, // Update with mint address
        { new: true } // Return the updated document
      );

      return {
        success: true,
        mintAddress: result.mintAddress,
        signature: result.signature,
      };
    } else {
      throw new Error("NFT minting failed");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getCharacter = async (req, res) => {
  try {
    const characters = await Character.find();
    res.json(characters);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.purchaseAndMintCharacter = async (req, res) => {
  console.log("Request Body:", req.body);
  const { walletAddress, formattedMonika, characterIds } = req.body;

  if (!Array.isArray(characterIds) || characterIds.length === 0) {
    return res.status(400).json({ message: "No character IDs provided." });
  }

  try {
    const player = await Player.findOne({
      walletAddress: walletAddress.toLowerCase(),
    });
    if (!player) return res.status(404).json({ message: "Player not found." });

    const characters = await Character.find({
      stringId: { $in: characterIds },
    });
    if (characters.length !== characterIds.length) {
      return res
        .status(404)
        .json({ message: "One or more characters not found." });
    }

    const mintedCharacters = [];

    for (const character of characters) {
      if (
        character.mintedBy.some((entry) => entry.username === formattedMonika)
      ) {
        console.log(
          `Character ${character.name} already minted by ${formattedMonika}. Skipping...`
        );
        continue;
      }

      try {
        const uniqueCharacterName = `${
          character.name
        }-${formattedMonika.replace(/\s+/g, "-")}`;
        const symbol = character.name
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase())
          .join("");

        const metadata = {
          name: uniqueCharacterName,
          detail: character.description,
          symbol: symbol,
          image: character.avatarUrl.file_url,
          file_url: character.file_url,
          animations: character.animations,
        };

        const metadataUri = await uploadMetadata(metadata);
        console.log(`Metadata uploaded successfully: ${metadataUri}`);

        const mintAddress = await mintNft(metadataUri, metadata);
        if (!mintAddress)
          throw new Error(`Failed to mint NFT for ${character.name}`);

        character.mintedBy.push({ username: formattedMonika, mintAddress });
        character.owner = player._id;
        character.playerId = player._id;
        character.mintAddress = mintAddress;
        character.symbol = symbol;

        await character.save();
        mintedCharacters.push({ characterId: character.stringId, mintAddress });
      } catch (error) {
        console.error(`Error minting character ${character.name}:`, error);
        return res.status(500).json({
          message: `Error minting ${character.name}: ${error.message}`,
        });
      }
    }

    if (mintedCharacters.length === 0) {
      return res.status(400).json({
        message:
          "No characters were minted due to errors or already being minted.",
      });
    }

    player.characters.push(...characters.map((character) => character._id));
    await player.save();

    res.json({
      message: "Characters purchased and minted successfully.",
      characters: mintedCharacters,
    });
  } catch (error) {
    console.error("Error purchasing and minting characters:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.purchaseAndTransferCharacter = async (req, res) => {
  const { walletAddress, characterId } = req.body;

  try {
    // Fetch character details
    const character = await Character.findById(characterId);
    if (!character) {
      return res.status(404).json({ message: "Character not found" });
    }

    const currentOwner = character.owner; // Existing owner wallet address
    if (!currentOwner) {
      return res
        .status(400)
        .json({ message: "Character is not owned by anyone" });
    }

    // Transfer NFT on the blockchain
    const mint = character.mintAddress; // Assuming `mintAddress` is stored in the database
    if (!mint) {
      return res
        .status(400)
        .json({ message: "Mint address not found for the character" });
    }

    await transferV1(umi, {
      mint, // Mint address of the NFT
      authority: umi.wallet, // Current owner's signer authority
      tokenOwner: currentOwner, // Current owner's public key
      destinationOwner: walletAddress, // New owner's public key
      tokenStandard: "NonFungible", // Ensures transfer is for an NFT
    }).sendAndConfirm(umi);

    // Update ownership in the database
    character.owner = walletAddress;
    await character.save();

    res.json({
      message: "Character purchased and transferred successfully",
      character,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.listCharacter = async (req, res) => {
  const { characterId, price, walletAddress } = req.body;

  try {
    const player = await findOne({ walletAddress });
    const character = await Character.findById(characterId);

    if (!character || character.owner.toString() !== player._id.toString()) {
      return res.status(403).json({ message: "Not the owner" });
    }

    character.price = price;
    await character.save();
    res.json(character);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.modifyListPrice = async (req, res) => {
  const { characterId, price, walletAddress } = req.body;

  try {
    const character = await Character.findById(characterId);

    if (!character)
      return res.status(404).json({ message: "Character not found" });
    const player = await findById(character.owner);

    if (player.walletAddress !== walletAddress) {
      return res.status(403).json({ message: "Not the initial lister" });
    }

    character.price = price;
    await character.save();
    res.json(character);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.buyCharacter = async (req, res) => {
  const { walletAddress, characterId } = req.body;

  try {
    const buyer = await findOne({ walletAddress });
    const character = await Character.findById(characterId);

    if (!buyer || !character)
      return res.status(404).json({ message: "Buyer or Character not found" });

    if (buyer.cartesiTokenBalance < character.price) {
      return res.status(400).json({ message: "Insufficient funds" });
    }

    buyer.cartesiTokenBalance -= character.price;
    const seller = await findById(character.owner);
    seller.cartesiTokenBalance += character.price * 0.97; // 3% fee
    await buyer.save();
    await seller.save();

    character.owner = buyer._id;
    await character.save();
    res.json(buyer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.fetchCharacters = async (req, res) => {
  const { id } = req.params;
  try {
    const characters = id
      ? await Character.findById(id)
      : await Character.find();
    res.json(characters);
  } catch (error) {
    res.status(500).send(error);
  }
};

exports.fetchPlayersCharacters = async (req, res) => {
  const { playerId } = req.params;
  try {
    const characters = await Character.find({ playerId });
    res.json(characters);
  } catch (error) {
    res.status(500).send(error);
  }
};

exports.updateCharacter = async (req, res) => {
  const { characterId } = req.params; // Get characterId from the request parameters
  const {
    name,
    health,
    strength,
    attack,
    speed,
    super_power,
    price,
    playerId,
  } = req.body; // Get attributes to update from request body

  try {
    // Find the character by ID
    const character = await Character.findById(characterId);
    if (!character) {
      return res.status(404).json({ message: "Character not found" });
    }

    // Update character attributes if provided
    if (name !== undefined) character.name = name;
    if (health !== undefined) character.health = health;
    if (strength !== undefined) character.strength = strength;
    if (attack !== undefined) character.attack = attack;
    if (speed !== undefined) character.speed = speed;
    if (super_power !== undefined) character.super_power = super_power;
    if (price !== undefined) character.price = price;

    // Update the owner field
    if (playerId) {
      // Check if playerId is provided
      const player = await findById(playerId); // Use playerId from the request body
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }
      character.owner = player._id; // Set owner to the player's ID
    }

    // Save the updated character
    await character.save();

    res
      .status(200)
      .json({ message: "Character updated successfully", character });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.upgradeCharacter = async (req, res) => {
  const { characterId, attribute, amount } = req.body;

  try {
    // Find the character to upgrade
    const character = await Character.findById(characterId);
    if (!character) {
      return res.status(404).json({ message: "Character not found" });
    }

    // Check if the attribute is valid
    if (!["health", "strength", "attack", "speed"].includes(attribute)) {
      return res.status(400).json({ message: "Invalid attribute" });
    }

    // Ensure the amount is a positive number
    if (amount <= 0) {
      return res
        .status(400)
        .json({ message: "Upgrade amount must be positive" });
    }

    // Apply the upgrade
    character[attribute] += amount;

    // Record the upgrade
    character.upgrades.push({ attribute, value: amount });

    await character.save();

    res
      .status(200)
      .json({ message: "Character upgraded successfully", character });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// export default {
//   createCharacter,
//   getCharacter,
//   purchaseAndMintCharacter,
//   purchaseAndTransferCharacter,
//   listCharacter,
//   modifyListPrice,
//   buyCharacter,
//   fetchCharacters,
//   fetchPlayersCharacters,
//   updateCharacter,
//   upgradeCharacter,
// };
