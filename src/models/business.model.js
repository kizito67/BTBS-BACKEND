const mongoose = require("mongoose");

const businessSchema = new mongoose.Schema(
    {
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },

        businessName: {
            type: String,
            required: true,
            trim: true
        },

        category: {
            type: String,
            required: true,
            trim: true
        },

        isPremium: {
            type: Boolean,
            default: false
        },

        trialStartDate: {
            type: Date,
            default: Date.now
        },

        trialEndDate: {
            type: Date
        },

        subscriptionStatus: {
            type: String,
            enum: ["trial", "active", "expired"],
            default: "trial"
        },
        subscriptionEndDate: {
            type: Date,
            
        },

        boostCredits: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Business", businessSchema);