const mongoose = require("mongoose");
const crypto = require("crypto");

const tripSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        routeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Route",
            required: true,
            index: true,
        },
        shareToken: {
            type: String,
            unique: true,
            index: true,
        },
        currentLocation: {
            latitude: {
                type: Number,
                min: -90,
                max: 90,
            },

            longitude: {
                type: Number,
                min: -180,
                max: 180,
            },

            updatedAt: {
                type: Date,
            },
        },
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
            name: {
                type: String,
                required: true,
                trim: true,
            },

            placeId: {
                type: String,
            },
        },

        dropOffPoint: {
            name: {
                type: String,
                required: true,
                trim: true,
            },

            placeId: {
                type: String,
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

        confidenceScore: {
            type: Number,
            min: 0,
            max: 100,
        },

        confidenceLevel: {
            type: String,
            enum: ["High", "Medium", "Unconfirmed"],
        },

        status: {
            type: String,
            enum: [
                "planned",
                "active",
                "completed",
                "cancelled",
            ],
            default: "planned",
            index: true,
        },

        startedAt: {
            type: Date,
        },

        endedAt: {
            type: Date,
        },

    },
    {
        timestamps: true,
    }
);

tripSchema.pre("save", function (next) {
    if (!this.shareToken) {
        this.shareToken = crypto
            .randomBytes(16)
            .toString("hex");
    }
});

module.exports = mongoose.model("Trip", tripSchema);