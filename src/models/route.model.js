const mongoose = require("mongoose");

const routeSchema = new mongoose.Schema(
    {
        origin: {
            placeId: {
                type: String,
                required: true,
            },
            name: {
                type: String,
                required: true,
                trim: true,
            },
        },

        destination: {
            placeId: {
                type: String,
                required: true,
            },
            name: {
                type: String,
                required: true,
                trim: true,
            },
        },

        vehicleType: {
            type: String,
            enum: ["bus", "keke", "taxi"],
            required: true,
        },

        boardingPoint: {
            placeId: {
                type: String,
            },
            name: {
                type: String,
                required: true,
                trim: true,
            },
        },

        transferPoint: {
            placeId: {
                type: String,
            },
            name: {
                type: String,
                trim: true,
            },
        },

        dropOffPoint: {
            placeId: {
                type: String,
            },
            name: {
                type: String,
                required: true,
                trim: true,
            },
        },

        fareLow: {
            type: Number,
            required: true,
            min: 0,
        },

        fareHigh: {
            type: Number,
            required: true,
            min: 0,
        },

        averageFare: {
            type: Number,
            required: true,
            min: 0,
        },

        totalConfirmations: {
            type: Number,
            default: 0,
        },

        confidenceScore: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },

        confidenceLevel: {
            type: String,
            enum: ["High", "Medium", "Unconfirmed"],
            default: "Unconfirmed",
        },

        lastConfirmedAt: {
            type: Date,
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
    }
);

routeSchema.index({
    "origin.placeId": 1,
    "destination.placeId": 1,
    vehicleType: 1,
    confidenceScore: -1,
});



module.exports = mongoose.model("Route", routeSchema);