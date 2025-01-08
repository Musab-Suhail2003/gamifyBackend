const express = require('express');
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const passport = require('passport');
const jwt = require('jsonwebtoken'); // Import jsonwebtoken

const router = express.Router();

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

router.post('/users/:userId/add-xp-coin', userController.updateStats);
router.get('/', userController.getAllUsers);

module.exports = router;