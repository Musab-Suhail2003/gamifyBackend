const mongoose = require('mongoose');
const milestone = require('./MileStoneModel');

const TaskModel = mongoose.Schema({
    milestone_id : {type: mongoose.Schema.Types.ObjectId, ref: 'milestone', required: true},
    title: { type: String, required: true },
    description: { type: String, required: true },
    level: { type: String, required: true, enum: ['EASY', 'MEDIUM', 'HARD'] },
    isCompleted: { type: Boolean, default: false}
});

const Task = mongoose.model('task', TaskModel);

TaskModel.statics.completeTask = async function(taskId) {
    try {
        const task = await this.findByIdAndUpdate
            (taskId,
                { isCompleted: true },
                { new: true, runValidators: true }
            );
        return task;
    }
    catch (error) {
        throw error;
    }
}



module.exports = Task;
