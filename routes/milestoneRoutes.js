const express = require('express');
const milestoneController = require('../controllers/milestoneController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', milestoneController.getAllMilestones);
router.get('/:id', milestoneController.getMilestoneById);
router.post('/',  milestoneController.createMilestone);
router.patch('/:id',  milestoneController.updateMilestone);
router.delete('/:id',  milestoneController.deleteMilestone);
router.get('/quest/:questId', milestoneController.getMilestonesbyQuestId);
router.get('/:id/check-tasks', milestoneController.checkTasksCompletion);

module.exports = router;
