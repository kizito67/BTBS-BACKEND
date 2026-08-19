const express = require("express");

const router = express.Router();

const {
    createReview,
    getListingReviews,
} = require("../controllers/review.controller");

const {
    protect,
} = require("../middleware/auth.middleware");

// ==========================================
// CREATE REVIEW
// ==========================================

router.post(
    "/:listingId",
    protect,
    createReview
);

// ==========================================
// GET REVIEWS
// ==========================================

router.get(
    "/:listingId",
    getListingReviews
);

module.exports = router;