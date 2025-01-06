const {Character} = require('../models/characterModel');
const mongoose = require('mongoose');

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
async updateCharacter (req, res) {
    try {
        const character = await Character.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
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

async   getCharacterbyUserId (req, res) {
        try {
            const { userId } = req.params;
            const character = await Character.findOne({ userId: userId });
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