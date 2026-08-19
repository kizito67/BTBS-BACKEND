const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
    {
        listingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Listing",
            required: true,
            index: true,
        },

        businessId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Business",
            required: true,
            index: true,
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },

        comment: {
            type: String,
            trim: true,
            maxlength: 1000,
        },
    },
    {
        timestamps: true,
    }
);

// One user can review a particular listing only once
reviewSchema.index(
    {
        listingId: 1,
        userId: 1,
    },
    {
        unique: true,
    }
);

module.exports = mongoose.model(
    "Review",
    reviewSchema
);