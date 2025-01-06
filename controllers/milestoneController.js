const MileStoneModel = require('../models/MileStoneModel');

class milestoneController{
    // Create a new milestone
async createMilestone(req, res){
    try {
        const milestone = new MileStoneModel(req.body);
        await milestone.save();
        res.status(201).json(milestone);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

async getMilestonesbyQuestId(req, res){
    try {
        const milestones = await MileStoneModel.find({ questId: req.params.questId });
        res.status(200).json(milestones);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Get all milestones
async getAllMilestones (req, res) {
    try {
        const milestones = await MileStoneModel.find();
        res.status(200).json(milestones);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Get a single milestone by ID
async getMilestoneById (req, res) {
    try {
        const milestone = await MileStoneModel.findById(req.params.id);
        if (!milestone) {
            return res.status(404).json({ error: 'Milestone not found' });
        }
        res.status(200).json(milestone);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Update a milestone by ID
async updateMilestone (req, res) {
    try {
        const milestone = await MileStoneModel.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!milestone) {
            return res.status(404).json({ error: 'Milestone not found' });
        }
        res.status(200).json(milestone);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

// Delete a milestone by ID
async deleteMilestone (req, res){
    try {
        const milestone = await MileStoneModel.findByIdAndDelete(req.params.id);
        if (!milestone) {
            return res.status(404).json({ error: 'Milestone not found' });
        }
        res.status(200).json({ message: 'Milestone deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Add a task to a milestone
async addTaskToMilestone(req, res) {
    try {
        const milestone = await MileStoneModel.addTask(req.params.id, req.body.taskId);
        res.status(200).json(milestone);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

// Check tasks completion for a milestone
async checkTasksCompletion (req, res) {
    try {
        const milestone = await MileStoneModel.findById(req.params.id);
        if (!milestone) {
            return res.status(404).json({ error: 'Milestone not found' });
        }
        await milestone.checkTasksCompletion();
        res.status(200).json(milestone);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
}

module.exports = new milestoneController();