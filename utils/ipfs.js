// utils/ipfs.js
const axios = require("axios");
const FormData = require("form-data");

const PINATA_API = "https://api.pinata.cloud/pinning/pinFileToIPFS";

const pinFileToIPFS = async (fileBuffer, fileName) => {
  const formData = new FormData();
  formData.append("file", fileBuffer, { filename: fileName });

  const res = await axios.post(PINATA_API, formData, {
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    headers: {
      ...formData.getHeaders(),
      pinata_api_key: process.env.PINATA_API_KEY,
      pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY,
    },
  });

  return `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`;
};

module.exports = { pinFileToIPFS };
