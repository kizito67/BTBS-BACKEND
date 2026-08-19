const express = require("express");

const router = express.Router();

const {
    getSubscriptionStatus,
} = require("../controllers/subscription.controller");

const {
    protect,
} = require("../middleware/auth.middleware");

router.get(
    "/status",
    protect,
    getSubscriptionStatus
);

module.exports = router;