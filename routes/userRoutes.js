const express = require('express');
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const passport = require('passport');
const jwt = require('jsonwebtoken'); 
const router = express.Router();
const UserModel = require('../models/UserModel.js');

router.post('/google-login', userController.googleLogin);
router.get('/:googleId', userController.getUserByGoogleId);

// // Google OAuth routes
// router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// router.get('/auth/google/callback', 
//   passport.authenticate('google', { failureRedirect: '/' }),
//   (req, res) => {
//     // Successful authentication, generate a token and send it in the response body
//     const token = jwt.sign({ id: req.user._id, email: req.user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
//     const user = req.user;
//     res.json({ token, user }); // Send the token in the response body
//   }
// ); //un used

router.get('/', userController.getAllUsers);
router.patch('/bio/:id', async (req, res) => {
  const { id } = req.params;
  const { newBio } = req.body;

  if (!newBio) {
    return res.status(400).json({ error: 'New bio is required' });
  }

  try {
    const updatedUser = await UserModel.updateBio(id, newBio);
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json({ message: 'Bio updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Error updating bio:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { fcm_token } = req.body;

  if (!fcm_token) {
        console.log("printing req body for updating fcm token"+req.body);
    return res.status(400).json({ error: 'Token is required' });

  }

  try {
    const updatedUser = await UserModel.findByIdAndUpdate(req.params.id, {fcm_token : fcm_token}, {
                new: true,
                runValidators: true
            });

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json({ message: 'fcm token updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Error updating fcm token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/refresh/:id', async (req, res) => {
  const {id} = req.params;
  if(!id){
    console.log('no id provided');
    return res.satus(400).json({error: 'no id provided'});
  }
  console.log('fetching user details aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  try{
    const user = await UserModel.findById(req.params.id);
    console.log(user);
    if(!user){
      return res.status(404).json({message: 'user not found'});
    }
    res.status(200).json({user});
  }
  catch(error){
    return res.satus(500).json({error: erorr.toString()});
  }
});

module.exports = router;
