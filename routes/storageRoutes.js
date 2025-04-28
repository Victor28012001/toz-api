const express = require('express');
const { createStorage, getStorage, updateStorage } = require('../controllers/storageController');

const router = express.Router();

router.post('/', createStorage);
router.get('/', getStorage);
router.put('/', updateStorage);

module.exports = router;
