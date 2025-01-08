const mongoose = require('mongoose');
const task = require('./TaskModel');
const Task = require('./TaskModel');

const MileStoneModel = mongoose.Schema({
    questId: {type: mongoose.Schema.Types.ObjectId, ref: 'quest', required: true},
    title: { type: String, required: true },
    description: { type: String, required: true },
    days: { type: Number, required: true },
    completionPercent: { type: Number, default: 0, min: 0, max: 100},
});

MileStoneModel.statics.addTask = async function(milestoneId, taskId) {
    try {
        const milestone = await this.findByIdAndUpdate(
            milestoneId,
            { $push: { tasks: taskId } },
            { new: true, runValidators: true }
        );
        return milestone;
    } catch (error) {
        throw error;
    }
}
MileStoneModel.methods.checkCompletion = async function(milestoneId) {
    try {
        const tasks = await Task.find({ milestone_id: milestoneId });
        let completion = 0;
        for (let i = 0; i < tasks.length; i++) {
            const task = tasks[i];
            completion += task.isCompleted ? 1 : 0;
        }
        completion = (completion / tasks.length) * 100;
        const updatedQuest = await this.findByIdAndUpdate(
            questId,
            { completionPercent: completion },
            { new: true, runValidators: true }
        );
        return updatedQuest;
    } catch (error) {
        throw error;
    }
}


const milestone = mongoose.model('milestone', MileStoneModel);

module.exports = milestone;