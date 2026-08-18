const Listing = require("../models/listing.model");
const Business = require("../models/business.model");


// ==========================================
// CREATE BUSINESS LISTING
// ==========================================

const createListing = async (req, res) => {
    try {
        const {
            description,
            location,
            photoUrls = [],
        } = req.body;

        // ==========================================
        // VALIDATE REQUIRED FIELDS
        // ==========================================

        if (!description || !location) {
            return res.status(400).json({
                success: false,
                message: "Description and location are required",
            });
        }

        // ==========================================
        // VALIDATE LOCATION
        // ==========================================

        if (
            location.lat === undefined ||
            location.lng === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "Latitude and longitude are required",
            });
        }

        if (
            location.lat < -90 ||
            location.lat > 90 ||
            location.lng < -180 ||
            location.lng > 180
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid coordinates",
            });
        }

        // ==========================================
        // FIND BUSINESS
        // ==========================================

        const business = await Business.findOne({
            ownerId: req.user._id,
        });

        if (!business) {
            return res.status(404).json({
                success: false,
                message: "Business profile not found",
            });
        }

        // ==========================================
        // CREATE LISTING
        // ==========================================

        const listing = await Listing.create({
            businessId: business._id,

            description,

            location: {
                lat: location.lat,
                lng: location.lng,
            },

            photoUrls,
        });

        // ==========================================
        // RETURN FRONTEND-FRIENDLY RESPONSE
        // ==========================================

        return res.status(201).json({
            success: true,

            listing: {
                _id: listing._id,
                businessName: business.businessName,
                category: business.category,
                description: listing.description,
                location: listing.location,
                photoUrls: listing.photoUrls,
                vendorId: business.ownerId,
                createdAt: listing.createdAt,
            },
        });

    } catch (error) {
        console.error("Create listing error:", error);

        return res.status(500).json({
            success: false,
            message: "Error creating listing",
            error: error.message,
        });
    }
};

// ==========================================
// GET MY LISTINGS
// ==========================================

const getMyListings = async (req, res) => {
    try {
        // Find the business belonging to the logged-in user
        const business = await Business.findOne({
            ownerId: req.user._id,
        });

        if (!business) {
            return res.status(404).json({
                success: false,
                message: "Business profile not found",
            });
        }

        // Find all listings belonging to this business
        const listings = await Listing.find({
            businessId: business._id,
        }).sort({
            createdAt: -1,
        });

        // Format response for frontend
        const formattedListings = listings.map((listing) => ({
            _id: listing._id,
            businessName: business.businessName,
            category: business.category,
            description: listing.description,
            location: listing.location,
            photoUrls: listing.photoUrls,
            vendorId: business.ownerId,
            createdAt: listing.createdAt,
        }));

        return res.status(200).json({
            success: true,
            listings: formattedListings,
        });

    } catch (error) {
        console.error("Get my listings error:", error);

        return res.status(500).json({
            success: false,
            message: "Error fetching listings",
            error: error.message,
        });
    }
};

module.exports = {
    createListing,
    getMyListings,
};