const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        businessId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Business",
            required: true,
        },

        reference: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },

        amount: {
            type: Number,
            required: true,
        },

        currency: {
            type: String,
            default: "NGN",
        },

        plan: {
            type: String,
            enum: ["weekly", "monthly"],
            required: true,
        },

        status: {
            type: String,
            enum: ["pending", "success", "failed"],
            default: "pending",
        },

        paidAt: {
            type: Date,
        },

        subscriptionStartDate: {
            type: Date,
        },

        subscriptionEndDate: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Payment", paymentSchema);