const Payment = require("../models/payment.model");
const Business = require("../models/business.model");
const paystack = require("../utils/paystack");
const crypto = require("crypto");

// ==========================================
// PREMIUM PLAN PRICES
// ==========================================

const PLANS = {
    weekly: {
        amount: 150000, // ₦1,500 in kobo
        durationDays: 7,
    },

    monthly: {
        amount: 550000, // ₦5,500 in kobo
        durationDays: 30,
    },
};

// ==========================================
// INITIALIZE PAYMENT
// ==========================================

const initializePayment = async (req, res) => {
    try {
        const { plan } = req.body;

        // ------------------------------------------
        // Validate plan
        // ------------------------------------------

        if (!plan || !PLANS[plan]) {
            return res.status(400).json({
                success: false,
                message: "Invalid plan. Choose weekly or monthly.",
            });
        }

        // ------------------------------------------
        // Find business owned by logged-in user
        // ------------------------------------------

        const business = await Business.findOne({
            ownerId: req.user._id,
        });

        if (!business) {
            return res.status(404).json({
                success: false,
                message: "Business account not found",
            });
        }

        // ------------------------------------------
        // Get plan
        // ------------------------------------------

        const selectedPlan = PLANS[plan];

        // ------------------------------------------
        // Generate unique reference
        // ------------------------------------------

        const reference = `BTBS_${Date.now()}_${crypto
            .randomBytes(4)
            .toString("hex")}`;

        // ------------------------------------------
        // Create payment record
        // ------------------------------------------

        const payment = await Payment.create({
            userId: req.user._id,
            businessId: business._id,
            reference,
            amount: selectedPlan.amount,
            currency: "NGN",
            plan,
            status: "pending",
        });

        // ------------------------------------------
        // Initialize Paystack
        // ------------------------------------------

        const response = await paystack.post(
            "/transaction/initialize",
            {
                email: req.user.email,
                amount: selectedPlan.amount,
                reference,

                callback_url: process.env.PAYSTACK_CALLBACK_URL,
            }
        );

        // ------------------------------------------
        // Return Paystack checkout URL
        // ------------------------------------------

        return res.status(200).json({
            success: true,
            message: "Payment initialized successfully",

            payment: {
                id: payment._id,
                reference,
                plan,
                amount: selectedPlan.amount,
                amountInNaira: selectedPlan.amount / 100,
            },

            authorizationUrl:
                response.data.data.authorization_url,

            accessCode:
                response.data.data.access_code,
        });

    } catch (error) {
        console.error(
            "Initialize payment error:",
            error.response?.data || error.message
        );

        return res.status(500).json({
            success: false,
            message: "Error initializing payment",
            error:
                error.response?.data?.message ||
                error.message,
        });
    }
};


// ==========================================
// VERIFY PAYMENT
// ==========================================

const verifyPayment = async (req, res) => {
    try {
        const { reference } = req.params;

        if (!reference) {
            return res.status(400).json({
                success: false,
                message: "Payment reference is required",
            });
        }

        // ------------------------------------------
        // Find payment
        // ------------------------------------------

        const payment = await Payment.findOne({
            reference,
            userId: req.user._id,
        });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment record not found",
            });
        }

        // ------------------------------------------
        // Ask Paystack for transaction status
        // ------------------------------------------

        const response = await paystack.get(
            `/transaction/verify/${reference}`
        );

        const transaction = response.data.data;

        // ------------------------------------------
        // Make sure payment succeeded
        // ------------------------------------------

        if (
            transaction.status !== "success" ||
            transaction.amount !== payment.amount
        ) {
            payment.status = "failed";

            await payment.save();

            return res.status(400).json({
                success: false,
                message: "Payment was not successful",
                status: transaction.status,
            });
        }

        // ------------------------------------------
        // Prevent processing payment twice
        // ------------------------------------------

        if (payment.status === "success") {
            return res.status(200).json({
                success: true,
                message: "Payment already verified",
                payment,
            });
        }
        
                // ------------------------------------------
        // Activate business premium
        // ------------------------------------------

        const business = await Business.findById(
            payment.businessId
        );

        if (!business) {
            return res.status(404).json({
                success: false,
                message: "Business account not found",
            });
        }

        business.isPremium = true;
        business.subscriptionStatus = "active";
        business.subscriptionEndDate = endDate;

        await business.save();


        // ------------------------------------------
        // Calculate subscription dates
        // ------------------------------------------

        const now = new Date();

// If the vendor already has an active subscription,
// extend from the current expiry date.
// Otherwise start from now.

let startDate = now;

if (
    business.subscriptionStatus === "active" &&
    business.subscriptionEndDate &&
    business.subscriptionEndDate > now
) {
    startDate = new Date(
        business.subscriptionEndDate
    );
}

const endDate = new Date(startDate);

if (payment.plan === "weekly") {
    endDate.setDate(
        endDate.getDate() + 7
    );
}

if (payment.plan === "monthly") {
    endDate.setDate(
        endDate.getDate() + 30
    );
}

        // ------------------------------------------
        // Update payment
        // ------------------------------------------

        payment.status = "success";
        payment.paidAt = new Date();
        payment.subscriptionStartDate = startDate;
        payment.subscriptionEndDate = endDate;

        await payment.save();


        // ------------------------------------------
        // Success
        // ------------------------------------------

        return res.status(200).json({
            success: true,

            message:
                "Payment verified and premium activated",

            subscription: {
                plan: payment.plan,
                amount: payment.amount / 100,
                startDate,
                endDate,
                status: "active",
            },

            payment,
        });

    } catch (error) {
        console.error(
            "Verify payment error:",
            error.response?.data || error.message
        );

        return res.status(500).json({
            success: false,
            message: "Error verifying payment",
            error:
                error.response?.data?.message ||
                error.message,
        });
    }
};


module.exports = {
    initializePayment,
    verifyPayment,
};