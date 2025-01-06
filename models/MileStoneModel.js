const mongoose = require('mongoose');

const MileStoneModel = mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    dueDate: { type: Date, required: true },
    isCompleted: { type: Boolean, required: true },
    tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }]
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
MileStoneModel.methods.checkTasksCompletion = async function() {
    const milestone = this;
    const tasks = await mongoose.model('Task').find({ _id: { $in: milestone.tasks } });
    const allCompleted = tasks.every(task => task.isCompleted);
    if (allCompleted && !milestone.isCompleted) {
        milestone.isCompleted = true;
        await milestone.save();
    }
};

const milestone = mongoose.model('milestone', MileStoneModel);

module.exports = milestone;