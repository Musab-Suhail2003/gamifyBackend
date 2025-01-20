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
const sendNotification = require('./services/notification');

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());


// Connect to MongoDB using Mongoose
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.log('Could not connect: ', err));

app.use(express.json());
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
app.post('/sendnotification', (req, res) => {
  const { deviceToken, title, body } = req.body; 
  try {
    sendNotification(deviceToken, title, body); 
    res.status(200).send({ success: true, message: 'Notification sent successfully!' });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).send({ success: false, message: 'Failed to send notification', error });
  }
});
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

      const task = await Task.findById(taskId);
      if (!task || !task.milestone_id) return;

      const relatedTasks = await Task.find({ milestone_id: task.milestone_id });

      const completedTasksCount = relatedTasks.filter(t => t.isCompleted).length;
      const totalTasksCount = relatedTasks.length;
      const milestoneCompletionPercent = (completedTasksCount / totalTasksCount) * 100;

      await MileStoneModel.findByIdAndUpdate(task.milestone_id, {
        completionPercent: milestoneCompletionPercent,
      });
      console.log(`${completedTasksCount} out of ${totalTasksCount} tasks done for milestone`);

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
    return { xp: 0, coins: 0 };  
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

      const milestone = await MileStoneModel.findById(milestoneId);
      if (milestone) {
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

         const milestonesToUpdate = await MileStoneModel.find({
            startTime: { $ne: null }
         });

    console.log(`Found ${milestonesToUpdate.length} milestones to update.`);

        for (const milestone of milestonesToUpdate) {
            const diffInMs = now - milestone.startTime;
            const daysPast = Math.floor(diffInMs / (1000 * 60)); // 1 day passes per 1 minute
            console.log('days past  '+daysPast); 
            const quest = await QuestModel.findById(milestone.questId);
            const user = await users.findById(quest.user_id);
            if (daysPast > 0) {
                const oldDays = milestone.days;
                const newDays = Math.max(milestone.days - daysPast, 0);
                
                console.log(`Milestone ID: ${milestone._id}, Days Remaining: ${oldDays} -> ${newDays}`);
                
                // Only send notification if days actually decreased
                if (newDays < oldDays && user?.fcm_token) {
                    const daysDecreased = oldDays - newDays;
                    try {
                        await sendNotification(
                            user.fcm_token,
                            'Milestone Update',
                            `Your milestone "${milestone.title}" has ${newDays} days remaining.`
                        );
                        console.log(`Notification sent for milestone: ${milestone._id}`);
                    } catch (error) {
                        console.error(`Failed to send notification for milestone ${milestone._id}:`, error);
                    }
                }
                
                milestone.days = newDays;
                milestone.startTime = new Date(milestone.startTime.getTime() + daysPast * (1000 * 60 * 60 * 24));
                await milestone.save();
            }
            else if (daysPast <= 0 && milestone.completionPercent < 100 ) {
                console.log('inside zero days left condition for cron job');
                    try {
                        await sendNotification(
                            user.fcm_token,
                            'Milestone Update for: ' + milestone.title + ' belonging to quest ' + quest.quest_name,
                            ` You've missed the deadline. However you can still gain half the rewards by completing it.`
                        );
                        console.log(`Notification sent for milestone: ${milestone._id}`);
                    } catch (error) {
                        console.error(`Failed to send notification for milestone ${milestone._id}:`, error);
                    }
                
                
            }

        }
        console.log(`${milestonesToUpdate.length} milestones checked and updated.`);
    } catch (error) {
        console.error('Error updating milestones:', error);
    }
});

