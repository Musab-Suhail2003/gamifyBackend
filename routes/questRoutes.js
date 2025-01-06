const express = require('express');
const questController = require('../controllers/questController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', questController.getAllQuests);
router.get('/:id', questController.getQuestById);
router.post('/', questController.createQuest);
router.put('/:id', questController.updateQuest);
router.delete('/:id', questController.deleteQuest);
router.get('/user/:userId', questController.getQuestsByUserId);

module.exports = router;