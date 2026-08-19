const Listing = require("../models/listing.model");
const Business = require("../models/business.model");
const cloudinary = require("../config/cloudinary");

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


// ==========================================
// GET PUBLIC LISTINGS
// ==========================================

const getPublicListings = async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;

    // Get all listings
    const listings = await Listing.find()
      .populate({
        path: "businessId",
        select: "businessName category ownerId",
      })
      .sort({ createdAt: -1 });

    let filteredListings = listings;

    // ==========================================
    // OPTIONAL LOCATION FILTER
    // ==========================================

    if (
      lat !== undefined &&
      lng !== undefined &&
      radius !== undefined
    ) {
      const userLat = Number(lat);
      const userLng = Number(lng);
      const searchRadius = Number(radius);

      if (
        Number.isNaN(userLat) ||
        Number.isNaN(userLng) ||
        Number.isNaN(searchRadius)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid location or radius",
        });
      }

      if (
        userLat < -90 ||
        userLat > 90 ||
        userLng < -180 ||
        userLng > 180 ||
        searchRadius <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid location or radius",
        });
      }

      filteredListings = listings.filter((listing) => {
        const listingLat = listing.location.lat;
        const listingLng = listing.location.lng;

        const distance = getDistanceInKm(
          userLat,
          userLng,
          listingLat,
          listingLng
        );

        return distance <= searchRadius;
      });
    }

    // ==========================================
    // FORMAT RESPONSE
    // ==========================================

    const formattedListings = filteredListings.map((listing) => ({
      _id: listing._id,

      businessName: listing.businessId.businessName,

      category: listing.businessId.category,

      description: listing.description,

      location: listing.location,

      photoUrls: listing.photoUrls,

      vendorId: listing.businessId.ownerId,

      createdAt: listing.createdAt,
    }));

    return res.status(200).json({
      success: true,
      listings: formattedListings,
    });

  } catch (error) {
    console.error("Get public listings error:", error);

    return res.status(500).json({
      success: false,
      message: "Error fetching public listings",
      error: error.message,
    });
  }
};


// ==========================================
// DISTANCE CALCULATION
// ==========================================

const getDistanceInKm = (
  lat1,
  lon1,
  lat2,
  lon2
) => {
  const earthRadius = 6371;

  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;

  const deltaLat =
    ((lat2 - lat1) * Math.PI) / 180;

  const deltaLon =
    ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLon / 2) ** 2;

  const c =
    2 * Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return earthRadius * c;
};
// ==========================================
// GET SINGLE PUBLIC LISTING
// ==========================================

const getListingById = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.listingId)
      .populate({
        path: "businessId",
        select: "businessName category ownerId isPremium subscriptionStatus",
      });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }

    return res.status(200).json({
      success: true,
      listing: {
        _id: listing._id,
        businessName: listing.businessId.businessName,
        category: listing.businessId.category,
        description: listing.description,
        location: listing.location,
        photoUrls: listing.photoUrls,
        vendorId: listing.businessId.ownerId,
        isPremium: listing.businessId.isPremium,
        subscriptionStatus:
          listing.businessId.subscriptionStatus,
        createdAt: listing.createdAt,
        updatedAt: listing.updatedAt,
      },
    });

  } catch (error) {
    console.error("Get listing error:", error);

    return res.status(500).json({
      success: false,
      message: "Error fetching listing",
      error: error.message,
    });
  }
};


// ==========================================
// UPLOAD LISTING PHOTOS
// ==========================================

const uploadListingPhotos = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No photos were uploaded",
      });
    }

    const uploadPromises = req.files.map((file) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "btbs/listings",
            resource_type: "image",
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result.secure_url);
            }
          }
        );

        stream.end(file.buffer);
      });
    });

    const urls = await Promise.all(uploadPromises);

    return res.status(200).json({
      success: true,
      urls,
    });

  } catch (error) {
    console.error("Cloudinary upload error:", error);

    return res.status(500).json({
      success: false,
      message: "Error uploading photos",
      error: error.message,
    });
  }
};
module.exports = {
    createListing,
    getMyListings,    
    getPublicListings,
    getListingById,
    uploadListingPhotos,
};