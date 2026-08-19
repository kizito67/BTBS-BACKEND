const express = require("express");

const router = express.Router();

const {
    getBusinessAnalytics,
    getListingPerformance,
} = require("../controllers/analytics.controller");

const {
    protect,
} = require("../middleware/auth.middleware");

// ==========================================
// BUSINESS ANALYTICS
// ==========================================

router.get(
    "/business",
    protect,
    getBusinessAnalytics
);

router.get(
    "/listings",
    protect,
    getListingPerformance
);

module.exports = router;