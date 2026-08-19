const crypto = require("crypto");

const Payment = require("../models/payment.model");
const Business = require("../models/business.model");

const paystackWebhook = async (req, res) => {
    try {
        const signature =
            req.headers["x-paystack-signature"];

        if (!signature) {
            return res.status(401).json({
                success: false,
                message: "Missing Paystack signature",
            });
        }

        // ==========================================
        // VERIFY PAYSTACK SIGNATURE
        // ==========================================

        const hash = crypto
            .createHmac(
                "sha512",
                process.env.PAYSTACK_SECRET_KEY
            )
            .update(req.rawBody)
            .digest("hex");

        if (hash !== signature) {
            return res.status(401).json({
                success: false,
                message: "Invalid Paystack signature",
            });
        }

        // ==========================================
        // PAYSTACK EVENT
        // ==========================================

        const event = req.body;

        console.log(
            "📦 Paystack webhook:",
            event.event
        );

        // We only process successful payments
        if (event.event !== "charge.success") {
            return res.sendStatus(200);
        }

        const transaction = event.data;

        const reference =
            transaction.reference;

        // ==========================================
        // FIND PAYMENT
        // ==========================================

        const payment = await Payment.findOne({
            reference,
        });

        if (!payment) {
            console.log(
                "⚠️ Payment not found:",
                reference
            );

            return res.sendStatus(200);
        }

        // ==========================================
        // PREVENT DUPLICATE PROCESSING
        // ==========================================

        if (payment.status === "success") {
            console.log(
                "ℹ️ Payment already processed:",
                reference
            );

            return res.sendStatus(200);
        }

        // ==========================================
        // VERIFY AMOUNT
        // ==========================================

        if (
            transaction.amount !==
            payment.amount
        ) {
            console.log(
                "❌ Payment amount mismatch:",
                reference
            );

            payment.status = "failed";

            await payment.save();

            return res.sendStatus(200);
        }

        // ==========================================
        // FIND BUSINESS
        // ==========================================

        const business =
            await Business.findById(
                payment.businessId
            );

        if (!business) {
            console.log(
                "⚠️ Business not found:",
                payment.businessId
            );

            return res.sendStatus(200);
        }

        // ==========================================
        // CALCULATE SUBSCRIPTION
        // ==========================================

        const now = new Date();

        let startDate = now;

        // If the vendor already has an active
        // subscription, extend from its expiry.
        if (
            business.subscriptionStatus ===
                "active" &&
            business.subscriptionEndDate &&
            business.subscriptionEndDate > now
        ) {
            startDate = new Date(
                business.subscriptionEndDate
            );
        }

        const endDate =
            new Date(startDate);

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

        // ==========================================
        // UPDATE PAYMENT
        // ==========================================

        payment.status = "success";

        payment.paidAt = now;

        payment.subscriptionStartDate =
            startDate;

        payment.subscriptionEndDate =
            endDate;

        await payment.save();

        // ==========================================
        // ACTIVATE PREMIUM
        // ==========================================

        business.isPremium = true;

        business.subscriptionStatus =
            "active";

        business.subscriptionEndDate =
            endDate;

        await business.save();

        console.log(
            "✅ Premium activated:",
            business.businessName
        );

        console.log(
            "📦 Plan:",
            payment.plan
        );

        console.log(
            "📅 Subscription expires:",
            endDate
        );

        return res.sendStatus(200);

    } catch (error) {
        console.error(
            "❌ Paystack webhook error:",
            error
        );

        return res.sendStatus(500);
    }
};

module.exports =
    paystackWebhook;