const { Character } = require("./models/Character"); // Adjust the path to your model file
const characters = require("./characters");
const mongoose = require("mongoose");

const path = require("path");
const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");

async function uploadToPinata(fileName, group) {
  try {
    const fileDirectory = path.join(__dirname, "assets");
    const filePath = path.join(fileDirectory, fileName);

    if (!fs.existsSync(filePath)) {
      throw new Error(`File does not exist: ${filePath}`);
    }

    // Read the file as a stream
    const fileStream = fs.createReadStream(filePath);

    // Create form data
    const formData = new FormData();
    formData.append("file", fileStream, fileName);

    // Add metadata for the group
    const metadata = JSON.stringify({
      name: fileName,
      keyvalues: {
        group, // Assign the group (e.g., "3dmodels", "images", "animations")
        uploadedBy: "Victor",
        project: "The O-zone",
      },
    });
    formData.append("pinataMetadata", metadata);

    // Optional pinning options
    const options = JSON.stringify({
      cidVersion: 0,
    });
    formData.append("pinataOptions", options);

    // Upload to Pinata
    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          pinata_api_key: "9d6fa236de30d7c15b2d",
          pinata_secret_api_key:
            "a7effaeaa75c219bd4e85f930a94cfbfa3cf978da37157e2bcc2ecf8212f6a71",
        },
      }
    );

    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
    console.log(`File uploaded to ${group} group:`, ipfsUrl);
    return ipfsUrl;
  } catch (e) {
    console.error("Error uploading file:", e.message);
    throw e;
  }
}

function getGroupFromFileName(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  if ([".gltf", ".glb", ".obj"].includes(ext)) {
    return "3dmodels";
  } else if ([".png", ".jpg", ".jpeg", ".gif"].includes(ext)) {
    return "images";
  } else if ([".fbx"].includes(ext)) {
    return "animations";
  }
  return "misc"; // Default group for unrecognized file types
}

async function uploadFile(fileName) {
  const group = getGroupFromFileName(fileName); // Determine the group
  const url = await uploadToPinata(fileName, group);
  console.log(`Uploaded ${fileName} to ${group}: ${url}`);
  return url;
}

async function processCharacters(characters) {
  const processedCharacters = [];
  let characterId = 1; // Initialize character ID

  for (const character of characters) {
    try {
      // Debugging logs
      console.log("Uploading avatar:", character.avatarUrl.file_url);
      console.log("Uploading model:", character.file_url);

      // Upload avatar
      const avatarUrl = await uploadFile(character.avatarUrl.file_url);

      // Upload model
      const modelUrl = await uploadFile(character.file_url);

      // Upload animations
      const animations = [];
      for (const animation of character.animations) {
        const fileUrl = await uploadFile(animation.file_url);
        animations.push({ name: animation.name, file_url: fileUrl });
      }

      // Check if URLs are undefined
      if (!avatarUrl || !modelUrl) {
        throw new Error("File upload failed");
      }

      // Construct the processed character
      const processedCharacter = {
        id: characterId++, // Increment the ID
        stringId: character.stringId,
        name: character.name,
        avatarUrl: avatarUrl,
        description: character.description,
        health: Math.floor(Math.random() * 31) + character.health - 15, // ±15 range
        strength: Math.floor(Math.random() * 6) + character.strength - 3, // ±3 range
        attack: Math.floor(Math.random() * 11) + character.attack - 5, // ±5 range
        speed: Math.floor(Math.random() * 7) + character.speed - 3, // ±3 range
        super_power: character.super_power,
        file_url: modelUrl,
        animations,
        total_battles: 0,
        total_wins: 0,
        total_losses: 0,
        price: character.price,
        owner: new mongoose.Types.ObjectId(), // Constant owner
        // owner: "25mwXtqvNTnQd9Xx9SdypyNv8DZR2bwGgzSnSPKVWstq", // Constant owner
        mintAddress: character.mintAddress,
        playerId: character.playerId,
        createdAt: new Date(),
        experience: 0,
      };

      processedCharacters.push(processedCharacter);
      console.log(processedCharacters);
    } catch (error) {
      console.error(`Failed to process character ${character.name}:`, error);
      continue; // Skip this character if upload fails
    }
  }

  return processedCharacters;
}

// Main function to upload and insert characters
async function uploadAndInsertCharacters(characters) {
  try {
    // Process the characters
    const processedCharacters = await processCharacters(characters);

    if (processedCharacters.length > 0) {
      // Define the batch insert function
      const batchInsert = async (documents, batchSize = 100) => {
        for (let i = 0; i < documents.length; i += batchSize) {
          const batch = documents.slice(i, i + batchSize);
          await Character.insertMany(batch);
          console.log(`Batch inserted successfully: ${batch.length} characters`);
        }
      };

      // Perform the batch insert
      await batchInsert(processedCharacters);
    } else {
      console.log("No characters were successfully processed.");
    }
  } catch (error) {
    console.error("Error inserting characters:", error);
  }
}



// Start processing
uploadAndInsertCharacters(characters);
