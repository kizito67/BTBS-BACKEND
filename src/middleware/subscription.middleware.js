const Business = require("../models/business.model");

const requireActiveSubscription = async (req, res, next) => {
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

        // ==========================================
        // FREE TRIAL
        // ==========================================

        if (business.subscriptionStatus === "trial") {

            // Trial has expired
            if (
                business.trialEndDate &&
                business.trialEndDate <= now
            ) {
                business.subscriptionStatus = "expired";
                business.isPremium = false;

                await business.save();

                return res.status(403).json({
                    success: false,
                    message:
                        "Your free trial has expired. Please subscribe to continue.",
                });
            }

            // Trial is still active
            return next();
        }

        // ==========================================
        // PAID SUBSCRIPTION
        // ==========================================

        if (business.subscriptionStatus === "active") {

            // Paid subscription has expired
            if (
                business.subscriptionEndDate &&
                business.subscriptionEndDate <= now
            ) {
                business.subscriptionStatus = "expired";
                business.isPremium = false;

                await business.save();

                return res.status(403).json({
                    success: false,
                    message:
                        "Your premium subscription has expired. Please renew to continue.",
                });
            }

            // Paid subscription still active
            return next();
        }

        // ==========================================
        // EXPIRED
        // ==========================================

        return res.status(403).json({
            success: false,
            message:
                "Your subscription has expired. Please subscribe to continue.",
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
