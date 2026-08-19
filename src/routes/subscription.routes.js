const express = require("express");

const router = express.Router();

const {
    checkSubscriptionStatus,
} = require("../controllers/subscription.controller");

const {
    protect,
} = require("../middleware/auth.middleware");

router.get(
    "/status",
    protect,
    checkSubscriptionStatus
);

module.exports = router;