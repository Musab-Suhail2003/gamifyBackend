const express = require('express');
const router = express.Router();
const characterController = require('../controllers/characterController');
const auth = require('../middleware/auth');

router.get('/', characterController.getAllCharacters);
router.get('/:id', characterController.getCharacterById);
router.post('/:id', characterController.updateCharacter);
router.get('/user/:userId', characterController.getCharacterbyUserId)
router.post('/additem', characterController.addItemtoCharacter)

module.exports = router;