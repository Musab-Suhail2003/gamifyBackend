const mongoose = require('mongoose');

const ItemModel = mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, required: true, enum: ['HAIR', 'FACE', 'BACKGROUND', 'BODY', 'EYES', 'HEADWEAR', 'NOSES', 'OUTFIT', 'FACE_ACCESSORY', 'BACK_ACCESORY'] },
    price: { type: Number, required: true }
});

const CharacterModel = mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true, unique: true }, // One-to-one relationship with User
    items: { type: [mongoose.Schema.Types.ObjectId], ref: 'Item' }, // One-to-many relationship with Item
}, { strict: false });

// Static method to add an item to a character
CharacterModel.statics.addItem = async function(characterId, itemDetails) {
    try {
        const character = await this.findById(characterId);
        if (!character) {
            throw new Error('Character not found');
        }

        // Create a new item
        const item = new Item(itemDetails);
        await item.save();

        // Add the item to the character's items array
        character.items.push(item._id);
        await character.save();

        return character;
    } catch (error) {
        throw error;
    }
};

const Item = mongoose.model('Item', ItemModel);
const Character = mongoose.model('Character', CharacterModel);

module.exports = { Item, Character };