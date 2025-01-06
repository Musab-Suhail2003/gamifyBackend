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
        quests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Quest' }],
        Character: { type: mongoose.Schema.Types.ObjectId, ref: 'Character' , unique: true},
        ownedItems: [{type: mongoose.Schema.Types.ObjectId, ref: 'Item', }]
    }
);

UserModel.plugin(findOrCreate);


// // Create a Character instance after a new User is created
// UserModel.post('save', async function(doc, next) {
//     try {
//         // Check if the character already exists to avoid duplicate creation
//         const existingCharacter = await Character.findOne({ userId: doc._id });
//         if (!existingCharacter) {
//             const character = new Character({ userId: doc._id });
//             console.log(character);
//             await character.save();
//             doc.Character = character._id;
//             await doc.save();
//         }
//         next();
//     } catch (error) {
//         next(error);
//     }
// });

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

const users = mongoose.model('users', UserModel);
module.exports = users;