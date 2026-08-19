const Business = require("../models/business.model");

const requireActiveSubscription = async (req, res, next) => {
    try {
        // Make sure user is logged in
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        // Make sure user is a business
        if (req.user.role !== "business") {
            return res.status(403).json({
                success: false,
                message: "Only vendors can access this feature",
            });
        }

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

        // ==========================================
        // CHECK SUBSCRIPTION EXPIRY
        // ==========================================

        if (
            business.subscriptionStatus === "active" &&
            business.trialEndDate &&
            business.trialEndDate <= now
        ) {
            business.isPremium = false;
            business.subscriptionStatus = "expired";

            await business.save();
        }

        // ==========================================
        // EXPIRED SUBSCRIPTION
        // ==========================================

        const isTrialActive =
            business.subscriptionStatus === "trial" &&
            business.trialEndDate &&
            business.trialEndDate > now;

        const isPremiumActive =
            business.subscriptionStatus === "active" &&
            business.isPremium &&
            business.trialEndDate &&
            business.trialEndDate > now;

        if (!isTrialActive && !isPremiumActive) {
            return res.status(403).json({
                success: false,
                message:
                    "Premium subscription required. Please subscribe to continue.",
                subscriptionRequired: true,
            });
        }

        // Make business available to controllers
        req.business = business;

        next();

    } catch (error) {
        console.error(
            "Subscription middleware error:",
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
    requireActiveSubscription,
};