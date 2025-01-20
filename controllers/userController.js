const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');
const dotenv = require('dotenv');
const { Character } = require('../models/characterModel');
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

class UserController {
    // Google Login: Verify Google token and create/find user
  async googleLogin(req, res) {
    console.log('google login');
    const { token } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const { name, email, picture } = ticket.getPayload();
        
        let user = await User.findOne({ email });
        if (!user) {
            // Create new user
            user = new User({ 
                name, 
                email, 
                googleId: ticket.getUserId(), 
                profilePicture: picture 
            });
            await user.save();

            console.log('user made');
            // Create character
            const character = new Character({ userId: user._id });
            await character.save();
            console.log('character made');


            user.Character = character._id;
            await user.save();

            console.log('New user created:', user);
        }

        const jwtToken = jwt.sign(
            { id: user._id, email: user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({ token: jwtToken, user });
    } catch (error) {
        console.error('Google login error:', error);
        res.status(400).json({ error: 'Invalid Google token' });
    }
  }

    // Google Callback (for OAuth-based flows)
    async googleCallback(req, res) {
        try {
            // Generate JWT for authenticated user
            const user = req.user; // User data passed by Passport.js
            const token = jwt.sign(
                { id: user._id, email: user.email },
                JWT_SECRET,
                { expiresIn: '7d' }
            );

            res.json({ token, user });
        } catch (err) {
            res.status(500).json({ error: 'Error generating token' });
        }
    }

    // Get user by Google ID
    async getUserByGoogleId(req, res) {
        try {
            const user = await User.findOne({ googleId: req.params.googleId });

            if (!user) {
                return res.status(404).json({
                    status: 'fail',
                    message: 'User not found',
                });
            }

            res.status(200).json({
                status: 'success',
                data: { user },
            });
        } catch (err) {
            res.status(500).json({
                status: 'fail',
                message: err.message,
            });
        }
  } 

   
    async getAllUsers(req, res){
        try {
            const users = await User.find().sort({XP: -1});


            if (!users) {
                return res.status(404).json({
                    status: 'fail',
                    message: 'Users not found',
                });
            }

            res.status(200).json({
                status: 'success',
                data: { users },
            });
        } catch (err) {
            res.status(500).json({
                status: 'fail',
                message: err.message,
            });
        }
    }
}

// Export an instance of the controller
module.exports = new UserController();
