const Review = require("../models/review.model");
const Listing = require("../models/listing.model");

// ==========================================
// CREATE REVIEW
// ==========================================

const createReview = async (req, res) => {
    try {
        const { listingId } = req.params;
        const { rating, comment } = req.body;

        // ==========================================
        // VALIDATE RATING
        // ==========================================

        if (
            rating === undefined ||
            rating < 1 ||
            rating > 5
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Rating must be between 1 and 5",
            });
        }

        // ==========================================
        // FIND LISTING
        // ==========================================

        const listing = await Listing.findById(
            listingId
        );

        if (!listing) {
            return res.status(404).json({
                success: false,
                message: "Listing not found",
            });
        }

        // ==========================================
        // CHECK EXISTING REVIEW
        // ==========================================

        const existingReview =
            await Review.findOne({
                listingId,
                userId: req.user._id,
            });

        if (existingReview) {
            return res.status(409).json({
                success: false,
                message:
                    "You have already reviewed this listing",
            });
        }

        // ==========================================
        // CREATE REVIEW
        // ==========================================

        const review = await Review.create({
            listingId,
            businessId: listing.businessId,
            userId: req.user._id,
            rating: Number(rating),
            comment,
        });

        return res.status(201).json({
            success: true,
            message: "Review submitted successfully",
            review,
        });

    } catch (error) {
        console.error(
            "Create review error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Error creating review",
            error: error.message,
        });
    }
};

// ==========================================
// GET LISTING REVIEWS
// ==========================================

const getListingReviews = async (req, res) => {
    try {
        const { listingId } = req.params;

        const reviews = await Review.find({
            listingId,
        })
            .populate(
                "userId",
                "fullName"
            )
            .sort({
                createdAt: -1,
            });

        const totalReviews = reviews.length;

        const averageRating =
            totalReviews > 0
                ? reviews.reduce(
                      (sum, review) =>
                          sum + review.rating,
                      0
                  ) / totalReviews
                : 0;

        return res.status(200).json({
            success: true,

            summary: {
                averageRating: Number(
                    averageRating.toFixed(1)
                ),

                totalReviews,
            },

            reviews,
        });

    } catch (error) {
        console.error(
            "Get reviews error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Error fetching reviews",
            error: error.message,
        });
    }
};

module.exports = {
    createReview,
    getListingReviews,
};