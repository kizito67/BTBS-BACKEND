const Business = require("../models/business.model");

const requireActiveSubscription = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

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
        // FREE TRIAL
        // ==========================================

        const isTrialActive =
            business.subscriptionStatus === "trial" &&
            business.trialEndDate &&
            business.trialEndDate > now;

        if (isTrialActive) {
            req.business = business;
            return next();
        }

        // ==========================================
        // PREMIUM SUBSCRIPTION
        // ==========================================

        const isPremiumActive =
            business.subscriptionStatus === "active" &&
            business.isPremium === true &&
            business.trialEndDate &&
            business.trialEndDate > now;

        if (isPremiumActive) {
            req.business = business;
            return next();
        }

        // ==========================================
        // TRIAL / PREMIUM EXPIRED
        // ==========================================

        if (
            business.subscriptionStatus === "trial" ||
            business.subscriptionStatus === "active"
        ) {
            business.isPremium = false;
            business.subscriptionStatus = "expired";

            await business.save();
        }

        return res.status(403).json({
            success: false,
            message:
                "Your free trial has ended. Please subscribe to continue.",
            subscriptionRequired: true,
        });

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