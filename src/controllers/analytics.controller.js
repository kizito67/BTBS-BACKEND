const ListingView = require("../models/listingView.model");
const Review = require("../models/review.model");
const Business = require("../models/business.model");

// ==========================================
// GET BUSINESS ANALYTICS
// ==========================================

const getBusinessAnalytics = async (req, res) => {
    try {
        // ==========================================
        // FIND BUSINESS
        // ==========================================

        const business = await Business.findOne({
            ownerId: req.user._id,
        });

        if (!business) {
            return res.status(404).json({
                success: false,
                message: "Business account not found",
            });
        }

        // ==========================================
        // PERIOD
        // ==========================================

        const period = Number(req.query.period) || 7;

        if (![7, 30].includes(period)) {
            return res.status(400).json({
                success: false,
                message:
                    "Period must be either 7 or 30 days",
            });
        }

        // ==========================================
        // DATE RANGE
        // ==========================================

        const now = new Date();

        const startDate = new Date(now);

        startDate.setDate(
            startDate.getDate() - (period - 1)
        );

        startDate.setHours(0, 0, 0, 0);

        // Previous period
        const previousStartDate = new Date(
            startDate
        );

        previousStartDate.setDate(
            previousStartDate.getDate() - period
        );

        const previousEndDate = new Date(
            startDate
        );

        previousEndDate.setMilliseconds(-1);

        // ==========================================
        // CURRENT VIEWS
        // ==========================================

        const totalViews =
            await ListingView.countDocuments({
                businessId: business._id,

                viewedAt: {
                    $gte: startDate,
                    $lte: now,
                },
            });

        // ==========================================
        // PREVIOUS VIEWS
        // ==========================================

        const previousViews =
            await ListingView.countDocuments({
                businessId: business._id,

                viewedAt: {
                    $gte: previousStartDate,
                    $lte: previousEndDate,
                },
            });

        // ==========================================
        // VIEW PERCENTAGE CHANGE
        // ==========================================

        let viewsChange = 0;

        if (previousViews > 0) {
            viewsChange =
                ((totalViews - previousViews) /
                    previousViews) *
                100;
        } else if (totalViews > 0) {
            viewsChange = 100;
        }

        viewsChange = Number(
            viewsChange.toFixed(1)
        );

        // ==========================================
        // DAILY VIEWS
        // ==========================================

        const dailyViews =
            await ListingView.aggregate([
                {
                    $match: {
                        businessId: business._id,

                        viewedAt: {
                            $gte: startDate,
                            $lte: now,
                        },
                    },
                },

                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: "%Y-%m-%d",
                                date: "$viewedAt",
                            },
                        },

                        views: {
                            $sum: 1,
                        },
                    },
                },

                {
                    $sort: {
                        _id: 1,
                    },
                },
            ]);

        // ==========================================
        // BUILD COMPLETE DATE RANGE
        // ==========================================

        const listingViews = [];

        for (let i = 0; i < period; i++) {
            const date = new Date(startDate);

            date.setDate(
                startDate.getDate() + i
            );

            const dateString =
                date.toISOString().split("T")[0];

            const existing =
                dailyViews.find(
                    (item) =>
                        item._id === dateString
                );

            listingViews.push({
                date: dateString,

                day: date.toLocaleDateString(
                    "en-US",
                    {
                        weekday: "short",
                    }
                ),

                views: existing
                    ? existing.views
                    : 0,
            });
        }

        // ==========================================
        // COMMUTER REACH
        // ==========================================

        const commuterReach =
            await ListingView.aggregate([
                {
                    $match: {
                        businessId: business._id,

                        viewedAt: {
                            $gte: startDate,
                            $lte: now,
                        },

                        "location.area": {
                            $nin: [
                                null,
                                "",
                            ],
                        },
                    },
                },

                {
                    $group: {
                        _id: "$location.area",

                        views: {
                            $sum: 1,
                        },
                    },
                },

                {
                    $sort: {
                        views: -1,
                    },
                },

                {
                    $limit: 10,
                },
            ]);

        // ==========================================
        // RATINGS
        // ==========================================

        const ratingStats =
            await Review.aggregate([
                {
                    $match: {
                        businessId:
                            business._id,
                    },
                },

                {
                    $group: {
                        _id: null,

                        averageRating: {
                            $avg: "$rating",
                        },

                        totalReviews: {
                            $sum: 1,
                        },
                    },
                },
            ]);

        const averageRating =
            ratingStats.length > 0
                ? Number(
                      ratingStats[0]
                          .averageRating
                          .toFixed(1)
                  )
                : 0;

        const totalReviews =
            ratingStats.length > 0
                ? ratingStats[0]
                      .totalReviews
                : 0;

        // ==========================================
        // RESPONSE
        // ==========================================

        return res.status(200).json({
            success: true,

            analytics: {
                period,

                totalViews,

                viewsChange,

                averageRating,

                totalReviews,

                listingViews,

                commuterReach:
                    commuterReach.map(
                        (item) => ({
                            location:
                                item._id,

                            views:
                                item.views,
                        })
                    ),
            },
        });
    } catch (error) {
        console.error(
            "Business analytics error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Error fetching business analytics",
            error: error.message,
        });
    
    }
};

// ==========================================
// GET LISTING PERFORMANCE
// ==========================================

const getListingPerformance = async (req, res) => {
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

        const period = Number(req.query.period) || 7;

        if (![7, 30].includes(period)) {
            return res.status(400).json({
                success: false,
                message:
                    "Period must be either 7 or 30 days",
            });
        }

        const startDate = new Date();

        startDate.setDate(
            startDate.getDate() - (period - 1)
        );

        startDate.setHours(0, 0, 0, 0);

        // ==========================================
        // GET LISTINGS
        // ==========================================

        const listings = await Listing.find({
            businessId: business._id,
        })
            .select(
                "_id description photoUrls createdAt"
            )
            .sort({
                createdAt: -1,
            });

        // ==========================================
        // GET VIEWS PER LISTING
        // ==========================================

        const viewStats =
            await ListingView.aggregate([
                {
                    $match: {
                        businessId:
                            business._id,

                        viewedAt: {
                            $gte: startDate,
                        },
                    },
                },

                {
                    $group: {
                        _id: "$listingId",

                        views: {
                            $sum: 1,
                        },
                    },
                },

                {
                    $sort: {
                        views: -1,
                    },
                },
            ]);

        // ==========================================
        // COMBINE LISTINGS + VIEWS
        // ==========================================

        const performance = listings.map(
            (listing) => {
                const stats =
                    viewStats.find(
                        (item) =>
                            item._id.toString() ===
                            listing._id.toString()
                    );

                return {
                    listingId:
                        listing._id,

                    description:
                        listing.description,

                    photoUrls:
                        listing.photoUrls,

                    views:
                        stats?.views || 0,

                    createdAt:
                        listing.createdAt,
                };
            }
        );

        // Highest performing listings first
        performance.sort(
            (a, b) => b.views - a.views
        );

        return res.status(200).json({
            success: true,

            period,

            listings: performance,
        });

    } catch (error) {
        console.error(
            "Listing performance error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Error fetching listing performance",
            error: error.message,
        });
    }
};

module.exports = {
    getBusinessAnalytics,
    getListingPerformance,
};