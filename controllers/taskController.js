const Task = require('../models/TaskModel');
const MilestoneModel = require('../models/MileStoneModel');

class TaskController {

    // Get a single task by ID
    async getTask(req, res) {
        try {
            const task = await Task.findById(req.params.id);
            if (!task) {
                return res.status(404).json({
                    status: 'fail',
                    message: 'Task not found'
                });
            }
            res.status(200).json({
                status: 'success',
                data: {
                    task
                }
            });
        } catch (err) {
            res.status(400).json({
                status: 'fail',
                message: err.message
            });
        }
    }

    // Create a new task
    async createTask(req, res) {
        try {
            const newTask = await Task.create(req.body);
            res.status(201).json({
                status: 'success',
                data: {
                    task: newTask
                }
            });
            console.log(`task created ${newTask}`);
        } catch (err) {
            res.status(400).json({
                status: 'fail',
                message: err.message
            });
        }
    }

    // Update a task by ID
    async updateTask(req, res) {
        console.log('asdsad');
        try {
            const tsk = await Task.findById(req.params.id);
            const mlstn = await MilestoneModel.findById(tsk.milestone_id);

            console.log(mlstn.startTime);
            if (mlstn.startTime == null) {
              console.log('prevented task completion because milestone wasnt started');
              res.status(400).json({
                status: 'fail',
                message: err.message
              });


            }

            const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
                new: true,
                runValidators: true
            });
            if (!task) {
                return res.status(404).json({
                    status: 'fail',
                    message: 'Task not found'
                });
            }
            res.status(200).json({
                status: 'success',
                data: {
                    task
                }
            });
        } catch (err) {
            res.status(400).json({
                status: 'fail',
                message: err.message
            });
        }
    }

    // Delete a task by ID
    async deleteTask(req, res) {
        try {
            const task = await Task.findByIdAndDelete(req.params.id);
            if (!task) {
                return res.status(404).json({
                    status: 'fail',
                    message: 'Task not found'
                });
            }
            res.status(204).json({
                status: 'success',
                data: null
            });
        } catch (err) {
            res.status(400).json({
                status: 'fail',
                message: err.message
            });
        }
    }
    // Get tasks by milestone ID
    async getTasksByMilestone(req, res) {
        try {
            const tasks = await Task.find({ milestone_id: req.params.milestoneId });
            res.status(200).json({
                status: 'success',
                results: tasks.length,
                data: {
                    tasks
                }
            });
        } catch (err) {
            res.status(400).json({
                status: 'fail',
                message: err.message
            });
        }
    }
}

module.exports = new TaskController();
