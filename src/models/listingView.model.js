const mongoose = require("mongoose");

const listingViewSchema = new mongoose.Schema(
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
            default: null,
        },

        // Location of the commuter when they viewed
        location: {
            lat: {
                type: Number,
            },

            lng: {
                type: Number,
            },

            area: {
                type: String,
                trim: true,
            },
        },

        viewedAt: {
            type: Date,
            default: Date.now,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model(
    "ListingView",
    listingViewSchema
);