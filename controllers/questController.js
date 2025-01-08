const Quest = require('../models/QuestModel');

class questController{
    async getAllQuests (req, res) {
        try {
            const quests = await Quest.find();
            res.status(200).json(quests);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    
    async getQuestById (req, res){
        try {
            const quest = await Quest.findById(req.params.id);
            if (!quest) {
                return res.status(404).json({ message: 'Quest not found' });
            }
            res.status(200).json(quest);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    
    async createQuest (req, res) {
        const { user_id, quest_name, completion_percent, quest_description, milestones, paused } = req.body;
        const newQuest = new Quest({ user_id, quest_name, completion_percent, quest_description, milestones, paused });
    
        try {
            const savedQuest = await newQuest.save();
            res.status(201).json(savedQuest);
            console.log('quest created by ' + user_id)
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
    
    async updateQuest (req, res) {
        try {
            const updatedQuest = await Quest.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
            if (!updatedQuest) {
                return res.status(404).json({ message: 'Quest not found' });
            }
            res.status(200).json(updatedQuest);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
    
    async deleteQuest (req, res)  {
        try {
            const deletedQuest = await Quest.findByIdAndDelete(req.params.id);
            if (!deletedQuest) {
                return res.status(404).json({ message: 'Quest not found' });
            }
            res.status(200).json({ message: 'Quest deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    
    async getQuestsByUserId (req, res)  {
        try {
            const quests = await Quest.find({ user_id: req.params.userId });
            res.status(200).json(quests);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async pauseQuest (req, res){
        try{
            const id = req.params.id;
            const quest = await Quest.findById(id);
            if(quest === null) {
                res.status(404).json({message: 'quest not found'});
                return;
                }
            quest.paused = !quest.paused;
            res.status(200).json({message: `paused quest with id: ${id}`});
        } catch (error) {
            res.status(500).json();
        }
    }
}

module.exports = new questController();