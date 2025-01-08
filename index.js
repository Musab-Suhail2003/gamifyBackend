const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');
const session = require('express-session');
const errorHandler = require('./middleware/errorHandler');
const taskRoutes = require('./routes/taskRoutes');
const milestoneRoutes = require('./routes/milestoneRoutes');
const questRoutes = require('./routes/questRoutes');
const characterRoutes = require('./routes/characterRoutes');
const userRoutes = require('./routes/userRoutes');
const jwt = require('jsonwebtoken');
const cors = require('cors');

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());


// Connect to MongoDB using Mongoose
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.log('Could not connect: ', err));

app.use(express.json()); // Ensure you can parse JSON bodies
app.use(session({
    resave: false,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET
}));

app.use('/tasks', taskRoutes);
app.use('/milestones', milestoneRoutes);
app.use('/quests', questRoutes);
app.use('/characters', characterRoutes);
app.use('/users', userRoutes);

app.get('/', (req, res) => res.send('Hello World!'));
app.use(errorHandler);

app.listen(3000, () => console.log(`Listening on port ${port}!`));

// Set up a change stream for the tasks collection
const Task = require('./models/TaskModel');
const milestones = require('./models/MileStoneModel');
const quests = require('./models/QuestModel');
const user = require('./models/UserModel');
const taskChangeStream = Task.watch();

taskChangeStream.on('change', async (change) => {
  try {
    console.log('change stream event on tasks');
    if (change.operationType === 'update' && change.updateDescription.updatedFields.isCompleted) {
      const taskId = change.documentKey._id;

      // Find the updated task
      const task = await Task.findById(taskId);
      if (!task || !task.milestone_id) return;

      // Get all tasks under the same milestone
      const relatedTasks = await Task.find({ milestone_id: task.milestone_id });

      // Calculate completion percentage for the milestone
      const completedTasksCount = relatedTasks.filter(t => t.isCompleted).length;
      const totalTasksCount = relatedTasks.length;
      const milestoneCompletionPercent = (completedTasksCount / totalTasksCount) * 100;

      // Update the milestone's completion percentage
      await milestones.findByIdAndUpdate(task.milestone_id, {
        completionPercent: milestoneCompletionPercent,
      });
      console.log(`${completedTasksCount} out of ${totalTasksCount} tasks done for milestone`);

      // Check if the milestone is 100% completed
      const milestone = await milestones.findById(task.milestone_id);
      if (milestone && milestone.questId) {
        const relatedMilestones = await milestones.find({ questId: milestone.questId });

        // Calculate quest completion percentage
        const completedMilestonesCount = relatedMilestones.filter(m => m.completion_percent === 100).length;
        const totalMilestonesCount = relatedMilestones.length;
        const questCompletionPercent = (completedMilestonesCount / totalMilestonesCount) * 100;
        // Update the quest's completion percentage
        const quest = await quests.findByIdAndUpdate(milestone.questId, {
          completion_percent: questCompletionPercent,
        }, { new: true });

        // Validate the quest and update user XP and coins
        if (quest) {
          const difficulty = task.level; // Assuming `task.level` holds the difficulty (e.g., 'EASY', 'MEDIUM', 'HARD')
          const userId = quest.user_id;

          // Define XP and coins increment values based on difficulty
          let xpIncrement = 0;
          let coinsIncrement = 0;

          switch (difficulty) {
            case 'EASY':
              xpIncrement = 100; // Adjust values as needed
              coinsIncrement = 50;
              break;
            case 'MEDIUM':
              xpIncrement = 150;
              coinsIncrement = 75;
              break;
            case 'HARD':
              xpIncrement = 200;
              coinsIncrement = 100;
              break;
            default:
              console.error('Invalid task difficulty:', difficulty);
              return;
          }

          // Update user XP and coins
          await user.updateOne(
            { _id: userId },
            { $inc: { XP: xpIncrement, coin: coinsIncrement } }
          );
        }
      }
    }
  } catch (error) {
    console.error('Error processing task change:', error);
  }
});

const milestoneChangeStream = milestones.watch();

milestoneChangeStream.on('change', async (change) => {
  try {
    console.log('change stream event on milestones');
    if (change.operationType === 'update' && change.updateDescription.updatedFields.completion_percent !== undefined) {
      const milestoneId = change.documentKey._id;

      // Find the updated milestone
      const milestone = await milestones.findById(milestoneId);
      if (milestone && milestone.questId) {
        // Get all milestones under the same quest
        const relatedMilestones = await milestones.find({ questId: milestone.questId });

        // Calculate quest completion percent
        const completedMilestonesCount = relatedMilestones.filter(m => m.completion_percent === 100).length;
        const totalMilestonesCount = relatedMilestones.length;
        const questCompletionPercent = (completedMilestonesCount / totalMilestonesCount) * 100;
       
        // Update the quest's completion percent
        await quests.findByIdAndUpdate(milestone.questId, {
          completion_percent: questCompletionPercent,
        });

        console.log(`${completedTasksCount} out of ${totalTasksCount} tasks done for milestone`);

      }
    }
  } catch (error) {
    console.error("Error processing milestone change:", error);
  }
});