const mongoose = require('mongoose');
const findOrCreate = require('mongoose-findorcreate');

// Define the UserModel (formerly UserSchema)
const UserModel = new mongoose.Schema({
    name: { type: String, required: true },
    email: {
        type: String,
        required: true,
        match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        unique: true,
    },
    googleId: { type: String, required: true, unique: true },
    bio: { type: String, minlength: 15 },
    XP: { type: Number, required: true, min: 0, default: 0 },
    coin: { type: Number, required: true, min: 0, default: 0 },
    profilePicture: { type: String },
    Character: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'characters',
        unique: true,
    },
    ownedItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }],
    questsCompleted: { type: Number, default: 0 },
}, {strict: false});

// Add the findOrCreate plugin
UserModel.plugin(findOrCreate);

// Define static methods
UserModel.statics.updateBio = async function (userId, newBio) {
    try {
        // Correct `this` refers to the model
        const user = await this.findByIdAndUpdate(
            userId,
            { bio: newBio },
            { new: true, runValidators: true }
        );
        return user;
    } catch (error) {
        throw error;
    }
};

UserModel.statics.addXpCoin = async function (coin, xp, userId) {
    try {
        const user = await this.findByIdAndUpdate(
            userId,
            { $inc: { coin: coin, XP: xp } },
            { new: true, runValidators: true }
        );
        return user;
    } catch (error) {
        throw error;
    }
};

// Create and export the model
const User = mongoose.model('users', UserModel);
module.exports = User;

