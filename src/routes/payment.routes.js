const express = require("express");

const router = express.Router();

const {
    initializePayment,
    verifyPayment,
} = require("../controllers/payment.controller");

const {
    protect,
} = require("../middleware/auth.middleware");

// ==========================================
// INITIALIZE PAYMENT
// ==========================================

router.post(
    "/initialize",
    protect,
    initializePayment
);

// ==========================================
// VERIFY PAYMENT
// ==========================================

router.get(
    "/verify/:reference",
    protect,
    verifyPayment
);

module.exports = router;