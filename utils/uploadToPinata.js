// utils/uploadToPinata.ts
import path from "path";
import fs from "fs";
import axios from "axios";
import FormData from "form-data";

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY;

if (!PINATA_API_KEY || !PINATA_SECRET_API_KEY) {
  throw new Error(
    "Pinata API keys are not defined in the environment variables."
  );
}

export async function uploadToPinata(localFilePath, group) {
  const fileName = path.basename(localFilePath);
  if (!fs.existsSync(localFilePath)) {
    throw new Error(`File not found: ${localFilePath}`);
  }

  const formData = new FormData();
  formData.append("file", fs.createReadStream(localFilePath), fileName);

  const metadata = {
    name: fileName,
    keyvalues: {
      group,
      uploadedBy: "Victor",
      project: "The O-zone",
    },
  };

  const options = { cidVersion: 0 };

  formData.append("pinataMetadata", JSON.stringify(metadata));
  formData.append("pinataOptions", JSON.stringify(options));

  const response = await axios.post(
    "https://api.pinata.cloud/pinning/pinFileToIPFS",
    formData,
    {
      headers: {
        ...formData.getHeaders(),
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_API_KEY,
      },
    }
  );

  return `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
}
