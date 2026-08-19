const Business = require("../models/business.model");

const getSubscriptionStatus = async (req, res) => {
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
        // CHECK TRIAL EXPIRATION
        // ==========================================

        if (
            business.subscriptionStatus === "trial" &&
            business.trialEndDate &&
            business.trialEndDate <= now
        ) {
            business.subscriptionStatus = "expired";
            business.isPremium = false;

            await business.save();
        }

        // ==========================================
        // CHECK PREMIUM EXPIRATION
        // ==========================================

        if (
            business.subscriptionStatus === "active" &&
            business.subscriptionEndDate &&
            business.subscriptionEndDate <= now
        ) {
            business.subscriptionStatus = "expired";
            business.isPremium = false;

            await business.save();
        }

        // ==========================================
        // CALCULATE CURRENT STATUS
        // ==========================================

        let expiresAt = null;
        let daysRemaining = 0;

        if (business.subscriptionStatus === "trial") {
            expiresAt = business.trialEndDate;
        }

        if (business.subscriptionStatus === "active") {
            expiresAt = business.subscriptionEndDate;
        }

        if (expiresAt) {
            const difference =
                new Date(expiresAt).getTime() -
                now.getTime();

            daysRemaining = Math.max(
                0,
                Math.ceil(
                    difference /
                    (1000 * 60 * 60 * 24)
                )
            );
        }

        return res.status(200).json({
            success: true,

            subscription: {
                status:
                    business.subscriptionStatus,

                isPremium:
                    business.isPremium,

                expiresAt,

                daysRemaining,
            },
        });

    } catch (error) {
        console.error(
            "Get subscription status error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Error getting subscription status",
            error: error.message,
        });
    }
};

module.exports = {
    getSubscriptionStatus,
};