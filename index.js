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
const cron = require('node-cron');

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
const MileStoneModel = require('./models/MileStoneModel');
const QuestModel = require('./models/QuestModel');
const users = require('./models/UserModel');
const taskChangeStream = Task.watch();

taskChangeStream.on('change', async (change) => {
  try {
    console.log('change stream event on tasks');
    if ((change.operationType === 'update' && change.updateDescription.updatedFields.isCompleted)|| change.operationType === 'insert') {
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
      await MileStoneModel.findByIdAndUpdate(task.milestone_id, {
        completionPercent: milestoneCompletionPercent,
      });
      console.log(`${completedTasksCount} out of ${totalTasksCount} tasks done for milestone`);

      // Check if the milestone is 100% completed
      const milestone = await MileStoneModel.findById(task.milestone_id);
      if (milestone && milestone.questId) {
        const relatedMilestones = await MileStoneModel.find({ questId: milestone.questId });

        // Calculate quest completion percentage
        const completedMilestonesCount = relatedMilestones.filter(m => m.completion_percent === 100).length;
        const totalMilestonesCount = relatedMilestones.length;
        const questCompletionPercent = (completedMilestonesCount / totalMilestonesCount) * 100;
        // Update the quest's completion percentage
        const quest = await QuestModel.findByIdAndUpdate(milestone.questId, {
          completion_percent: questCompletionPercent,
        }, { new: true });

        // Validate the quest and update user XP and coins
        if (task.isCompleted) {
          const difficulty = task.level;
          const userId = quest.user_id;

                    
          const {xp, coins} = await calculateRewards(difficulty, milestone.days);

          console.log(`xp ${xp}, coin ${coins}`);
          await users.updateOne(
            { _id: userId },
            { $inc: { XP: xp, coin: coins } }
          );
        }
      }
    }
  } catch (error) {
    console.error('Error processing task change:', error);
  }
});

async function calculateRewards(difficulty, daysRemaining) {
    if (!['EASY', 'MEDIUM', 'HARD'].includes(difficulty)) {
    console.error('Invalid task difficulty:', difficulty);
    return { xp: 0, coins: 0 };  // Return zeros instead of null/undefined
  }
  const baseRewards = {
    'EASY': { xp: 100, coins: 50 },
    'MEDIUM': { xp: 150, coins: 75 },
    'HARD': { xp: 200, coins: 100 }
  };

  if (!baseRewards[difficulty]) {
    console.error('Invalid task difficulty:', difficulty);
    return null;
  }

  let { xp, coins } = baseRewards[difficulty];
  
  // Log days remaining and check if milestone is late
  console.log('Days remaining:', daysRemaining);
  if (daysRemaining <= 0) {
    console.log('Milestone is late - reducing rewards by half');
    xp = xp / 2;
    coins = coins / 2;
    console.log(`Reduced rewards - XP: ${xp}, Coins: ${coins}`);
  }

  return { xp, coins };
}


const milestoneChangeStream = MileStoneModel.watch();

milestoneChangeStream.on('change', async (change) => {
  try {
    console.log('change stream event on milestones');
    if (change.operationType === 'update') {
      const milestoneId = change.documentKey._id;

      // Find the updated milestone
      const milestone = await MileStoneModel.findById(milestoneId);
      if (milestone) {
        // Get all milestones under the same quest
        const relatedMilestones = await MileStoneModel.find({ questId: milestone.questId });

        // Calculate quest completion percent
        const completedMilestonesCount = relatedMilestones.filter(m => m.completionPercent === 100).length;
        const totalMilestonesCount = relatedMilestones.length;
        const questCompletionPercent = (completedMilestonesCount / totalMilestonesCount) * 100;
       
        await QuestModel.findByIdAndUpdate(
          milestone.questId,
          { completion_percent: questCompletionPercent },
          { new: true, runValidators: true }
        );
        
        console.log(`${completedMilestonesCount} out of ${totalMilestonesCount} milestones done for quest percentage set to: ${questCompletionPercent}`);

      }
    }
  } catch (error) {
    console.error("Error processing milestone change:", error);
  }
});

const questChangestream = QuestModel.watch();
questChangestream.on('change', async(change)=>{
  console.log('change stream event on quests');
  try{
    if(change.operationType === 'update'){
      const questId = change.documentKey._id;
      const q = await QuestModel.findById(questId);
        if(q.completion_percent == 100){

          const relatedQuests = await QuestModel.find({user_id: q.user_id});
          console.log('quest completed by user id: ' + q.user_id);

          const completedQuestsCount = relatedQuests.filter(q => q.completion_percent === 100).length;

          const user = await users.findByIdAndUpdate(
            q.user_id,
            {questsCompleted: completedQuestsCount},
            {new: true, runValidators: true}
          );
        }

    }
  }
  catch(error){
    console.error(error);
    
    
  }
})



cron.schedule('*/1 * * * *', async () => {
    try {
        const now = new Date();
        
        console.log('Cron Job Checking....');

        // Find milestones where startTime is NOT null, has passed, and days > 0
        const milestonesToUpdate = await MileStoneModel.find({
            startTime: { $ne: null, $lte: now }, // Ensure startTime is not null and has passed
            days: { $gt: 0 },                   // Ensure there are remaining days
        });

        for (const milestone of milestonesToUpdate) {
            // Calculate the difference in milliseconds between now and startTime
            const diffInMs = now - milestone.startTime;

            // Calculate how many full days have passed
            const daysPast = Math.floor(diffInMs / (1000 * 60 * 60 * 24)); // 1 day = 86400000 ms

            if (daysPast > 0) {
                const newDays = Math.max(milestone.days - daysPast, 0); // Ensure days do not go below 0
                console.log(`Milestone ID: ${milestone._id}, Days Remaining: ${milestone.days} -> ${newDays}`);

                // Update the days and startTime to reflect the adjustment
                milestone.days = newDays;
                milestone.startTime = new Date(milestone.startTime.getTime() + daysPast * (1000 * 60 * 60 * 24)); // Advance startTime
                await milestone.save(); // Save the updated milestone
            }
        }

        console.log(`${milestonesToUpdate.length} milestones checked and updated.`);
    } catch (error) {
        console.error('Error updating milestones:', error);
    }
});
