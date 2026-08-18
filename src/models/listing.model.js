const mongoose = require("mongoose");

const listingSchema = new mongoose.Schema(
    {
        businessId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Business",
            required: true,
            index: true,
        },

        description: {
            type: String,
            required: true,
            trim: true,
        },

        location: {
            lat: {
                type: Number,
                required: true,
                min: -90,
                max: 90,
            },

            lng: {
                type: Number,
                required: true,
                min: -180,
                max: 180,
            },
        },

        photoUrls: {
            type: [String],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Listing", listingSchema);