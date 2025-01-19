const {Character} = require('../models/characterModel');
const mongoose = require('mongoose');
const UserModel = require('../models/UserModel');

class characterController{
    // Get all characters
async getAllCharacters (req, res) {
    try {
        const characters = await Character.find();
        res.status(200).json({
            status: 'success',
            results: characters.length,
            data: {
                characters
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
}

// Get a single character by ID
async getCharacterById (req, res) {
    try {
        const character = await Character.findById(req.params.id);
        if (!character) {
            return res.status(404).json({
                status: 'fail',
                message: 'Character not found'
            });
        }
        res.status(200).json({
            status: 'success',
            data: {
                character
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
}


// Update a character by ID
async updateCharacter(req, res) {
    try {
        // Fetch the existing character data
        const existingCharacter = await Character.findById(req.params.id);

        if (!existingCharacter) {
            return res.status(404).json({
                status: 'fail',
                message: 'Character not found'
            });
        }

        // Calculate the number of updates
        let updatesCount = 0;
        for (const key in req.body) {
            if (req.body[key] !== existingCharacter[key]) {
                updatesCount++; // Increment if the field is different
            }
        } 
        console.log(updatesCount);

        const user = await UserModel.findById(existingCharacter.userId);
        console.log('logging user');

        if(user.coin < updatesCount*100){
            return res.status(400).json({
                status: 'fail',
                message: 'Not Enough Coin'
            });
        }
        const newCoin = user.coin - updatesCount*100;
        console.log(`removing ${updatesCount*100} coins from user` )
        const resp = await UserModel.findByIdAndUpdate(
            existingCharacter.userId,
            {coin : newCoin},
            {
                new: true,
                runValidators: true
            }
        );
        console.log(resp);
        
        // Perform the update
        const character = await Character.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );
    


        res.status(200).json({
            status: 'success',
            message: `Updated ${updatesCount} fields`,
            data: {
                character,
                resp
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
}


async   getCharacterbyUserId (req, res) {
        try {
            const { userId } = req.params;
            const character = await Character.findOne({ userId: userId });
            console.log(character);
            res.status(200).json({
                status: 'success',
                data: {
                    character
                }
            });
        } catch (err) {
            res.status(400).json({
                status: 'fail',
                message: err.message
            });
        }

    }
    async addItemtoCharacter(req, res){
        try {
            const { userId} = req.params;
            const {name, description, type, price} = req.body;
            const character = await Character.findById({userId});
            Character.addItemtoCharacter(character._id, {name, description, type, price});
            res.status(200).json({
                status: 'success',
                data: {
                    character
                }
            });
        } catch (err) {
            res.status(400).json({
                status: 'fail',
                message: err.message
            });
        }
    }
}


module.exports = new characterController();
