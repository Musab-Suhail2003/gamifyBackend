//const { name } = require('ejs');
const mongoose = require('mongoose');

//const ItemModel = mongoose.Schema({
//    name: { type: String, required: true, unique: true},
//    description: { type: String, required: true },
//    type: { type: String, required: true, enum: ['HAIR', 'FACE', 'BACKGROUND', 'BODY', 'EYES', 'HEADWEAR', 'NOSES', 'OUTFIT', 'FACE_ACCESSORY', 'BACK_ACCESORY'] },
//    price: { type: Number, required: true }
//});
//
const CharacterModel = mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true }, 
}, { strict: false });


//const Item = mongoose.model('Item', ItemModel);
const Character = mongoose.model('characters', CharacterModel);

module.exports = { Character };
