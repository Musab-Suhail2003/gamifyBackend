const mongoose = require('mongoose');
const findOrCreate = require('mongoose-findorcreate');
const { Character } = require('./characterModel');

const UserModel = mongoose.Schema(
    {
        name: {type: String, required: true},
        email: {type: String, required: true, match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/ },
        googleId: {type: String, required: true, unique: true},
        bio: {type: String, min: 50},
        XP: {type: Number, required: true, min: 0, default: 0},
        coin: {type: Number, required: true, min: 0, default: 0},
        profilePicture: {type: String},
        Character: { type: mongoose.Schema.Types.ObjectId, ref: 'characters' , unique: true},
        ownedItems: [{type: mongoose.Schema.Types.ObjectId, ref: 'Item', }],
        questsCompleted: {type: Number, default: 0}
    }
);

UserModel.plugin(findOrCreate);


 UserModel.statics.updateBio = async (userId, newBio) =>{
    try {
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
            {$inc: { coin: coin, xp: xp }},
            {new: true, runValidators: true}
        );
        return user;
    } catch (err) {
        throw err; // Rethrow the error to handle it elsewhere
    }
};

const users = mongoose.model('users', UserModel);
module.exports = users;
