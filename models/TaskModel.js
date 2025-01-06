const mongoose = require('mongoose');

const TaskModel = mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    level: { type: String, required: true, enum: ['EASY', 'MEDIUM', 'HARD'] },
    isCompleted: { type: Boolean, default: false}
});

const task = mongoose.model('task', TaskModel);

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



module.exports = task;
