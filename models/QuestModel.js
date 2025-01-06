const mongoose = require('mongoose');

const QuestModel = mongoose.Schema(
    {
        user_id: {type: mongoose.Schema.Types.ObjectId, required: true},
        quest_name: {type: String, required: true},
        completion_percent: {type: Number, required: true, min: 0, max: 100},
        quest_description: {type: String, required: true},
        milestones: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Milestone' }],
        paused: {type: Boolean, default: false},
    }
);
QuestModel.statics.addMilestone = async function(questId, milestoneId) {
    try {
        const quest = await this.findByIdAndUpdate(
            questId,
            { $push: { milestones: milestoneId } },
            { new: true, runValidators: true }
        );
        return quest;
    } catch (error) {
        throw error;
    }
};

QuestModel.methods.checkCompletion = async function(questId) {
    try {
        const quest = await this.findById(questId);
        let completion = 0;
        for (let i = 0; i < quest.milestones.length; i++) {
            const milestone = await mongoose.model('milestone').findById(quest.milestones[i]);
            completion += milestone.completion_percent;
        }
        completion = (completion / quest.milestones.length) * 100;
        const updatedQuest = await this.findByIdAndUpdate(
            questId,
            { completion_percent: completion },
            { new: true, runValidators: true }
        );
        return updatedQuest;
    } catch (error) {
        throw error;
    }
}

const quest = mongoose.model('quest', QuestModel);
module.exports = quest;