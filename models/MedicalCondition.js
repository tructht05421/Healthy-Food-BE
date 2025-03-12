const mongoose = require('mongoose');

const MedicalConditionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    restricted_foods: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Food'
    }],
    recommended_foods: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Food'
    }],
    isDelete: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('MedicalCondition', MedicalConditionSchema);
