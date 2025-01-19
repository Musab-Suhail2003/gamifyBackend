const mongoose = require('mongoose');
const findOrCreate = require('mongoose-findorcreate');
const { Character, Item } = require('./characterModel');

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


 // Create a Character instance after a new User is created
 //UserModel.post('save', async function(doc, next) {
 //    try {
 //        // Check if the character already exists to avoid duplicate creation
 //       console.log('creating character post save');
 //        const existingCharacter = await Character.findOne({ userId: doc._id });
 //        if (!existingCharacter) {
 //            const character = new Character({ userId: doc._id });
 //            console.log(character);
 //            await character.save();
 //            doc.Character = character._id;
 //            await doc.save();
 //        }
 //        next();
 //    } catch (error) {
 //        next(error);
 //    }
 //});
 //
//UserModel.statics.addItem = async function(userId, itemDetails) {
//    try {
//        const user = await this.findById(userId);
//        const item0 = await ItemModel.find({name: itemDetails.name});
//        if (!user) {
//            throw new Error('user not found');
//        }
//        if(!item0){
//            // Create a new item
//
//            const item = new Item(itemDetails);
//            await item.save();
//
//            // Add the item to the character's items array
//            user.items.push(item._id);
//        }else{
//            user.items.push(item0._id);
//        }
//
//
//        await character.save();
//        return character;
//    } catch (error) {
//        throw error;
//    }
//};

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
