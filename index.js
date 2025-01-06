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
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.log('Could not connect: ', err));

app.use(express.json()); // Ensure you can parse JSON bodies
app.use(session({
    resave: false,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/tasks', taskRoutes);
app.use('/milestones', milestoneRoutes);
app.use('/quests', questRoutes);
app.use('/characters', characterRoutes);
app.use('/users', userRoutes);

app.get('/', (req, res) => res.send('Hello World!'));
app.use(errorHandler);

app.listen(3000, () => console.log(`Example app listening on port ${port}!`));

// Set up a change stream for the tasks collection
const tasks = require('./models/TaskModel');
const milestones = require('./models/MileStoneModel');
const quests = require('./models/QuestModel');

const taskChangeStream = tasks.watch();
taskChangeStream.on('change', async (change) => {
  if (change.operationType === 'update' && change.updateDescription.updatedFields.isCompleted !== undefined) {
    const taskId = change.documentKey._id;
    const task = await tasks.findById(taskId).populate('milestone');
    if (task && task.milestone) {
      const milestone = await milestones.findById(task.milestone._id);
      if (milestone) {
        await milestone.checkTasksCompletion();
      }
    }
  }
});

const milestoneChangeStream = milestones.watch();
milestoneChangeStream.on('change', async (change) => {
  if (change.operationType === 'update' && change.updateDescription.updatedFields.isCompleted !== undefined) {
    const milestoneId = change.documentKey._id;
    const milestone = await milestones.findById(milestoneId);
    if (milestone) {
      const quest = await quests.findOne({ milestones: milestoneId });
      if (quest) {
        await quest.checkCompletion(quest._id);
      }
    }
  }
});