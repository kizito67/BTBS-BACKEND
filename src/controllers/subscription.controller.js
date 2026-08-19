const Business = require("../models/business.model");

const checkSubscriptionStatus = async (req, res) => {
    try {
        const business = await Business.findOne({
            ownerId: req.user._id,
        });

        if (!business) {
            return res.status(404).json({
                success: false,
                message: "Business account not found",
            });
        }

        const now = new Date();

        // Subscription has expired
        if (
            business.subscriptionStatus === "active" &&
            business.trialEndDate &&
            business.trialEndDate <= now
        ) {
            business.isPremium = false;
            business.subscriptionStatus = "expired";

            await business.save();
        }

        return res.status(200).json({
            success: true,
            subscription: {
                isPremium: business.isPremium,
                status: business.subscriptionStatus,
                expiresAt: business.trialEndDate,
            },
        });
    } catch (error) {
        console.error(
            "Check subscription error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Error checking subscription",
            error: error.message,
        });
    }
};

module.exports = {
    checkSubscriptionStatus,
};