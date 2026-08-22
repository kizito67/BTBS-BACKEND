const Trip = require("../models/trip.model");
const Route = require("../models/route.model");


// ==========================================
// CREATE TRIP
// ==========================================

const createTrip = async (req, res) => {
    try {

        const { routeId } = req.body;


        if (!routeId) {
            return res.status(400).json({
                success: false,
                message: "Route ID is required",
            });
        }


        // ==================================
        // FIND ROUTE
        // ==================================

        const route =
            await Route.findById(routeId);


        if (!route) {
            return res.status(404).json({
                success: false,
                message: "Route not found",
            });
        }


        // ==================================
        // CREATE TRIP
        // ==================================

        const trip =
            await Trip.create({

                userId: req.user._id,

                routeId: route._id,

                origin: {
                    placeId:
                        route.origin.placeId,

                    name:
                        route.origin.name,
                },

                destination: {
                    placeId:
                        route.destination.placeId,

                    name:
                        route.destination.name,
                },

                vehicleType:
                    route.vehicleType,

                boardingPoint: {
                    placeId:
                        route.boardingPoint?.placeId,

                    name:
                        route.boardingPoint.name,
                },

                dropOffPoint: {
                    placeId:
                        route.dropOffPoint?.placeId,

                    name:
                        route.dropOffPoint.name,
                },

                fareLow:
                    route.fareLow,

                fareHigh:
                    route.fareHigh,

                confidenceScore:
                    route.confidenceScore,

                confidenceLevel:
                    route.confidenceLevel,

                status: "planned",
            });


        return res.status(201).json({

            success: true,

            message:
                "Trip created successfully",

            trip,
        });


    } catch (error) {

        console.error(
            "Create trip error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Error creating trip",

            error: error.message,
        });
    }
};


// ==========================================
// GET MY TRIP
// ==========================================

const getTrip = async (req, res) => {
    try {

        const trip =
            await Trip.findOne({
                _id: req.params.tripId,

                userId: req.user._id,
            }).populate(
                "routeId"
            );


        if (!trip) {
            return res.status(404).json({
                success: false,
                message: "Trip not found",
            });
        }


        return res.status(200).json({

            success: true,

            trip,
        });


    } catch (error) {

        console.error(
            "Get trip error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Error fetching trip",

            error: error.message,
        });
    }
};


// ==========================================
// START TRIP
// ==========================================

const startTrip = async (req, res) => {
    try {

        const trip =
            await Trip.findOne({
                _id: req.params.tripId,

                userId: req.user._id,
            });


        if (!trip) {
            return res.status(404).json({
                success: false,
                message: "Trip not found",
            });
        }


        trip.status = "active";

        trip.startedAt = new Date();


        await trip.save();


        return res.status(200).json({

            success: true,

            message:
                "Trip started successfully",

            trip,
        });


    } catch (error) {

        return res.status(500).json({

            success: false,

            message:
                "Error starting trip",

            error: error.message,
        });
    }
};


// ==========================================
// END TRIP
// ==========================================

const endTrip = async (req, res) => {
    try {

        const trip =
            await Trip.findOne({
                _id: req.params.tripId,

                userId: req.user._id,
            });


        if (!trip) {
            return res.status(404).json({
                success: false,
                message: "Trip not found",
            });
        }


        trip.status = "completed";

        trip.endedAt = new Date();


        await trip.save();


        return res.status(200).json({

            success: true,

            message:
                "Trip completed successfully",

            trip,
        });


    } catch (error) {

        return res.status(500).json({

            success: false,

            message:
                "Error ending trip",

            error: error.message,
        });
    }
};

const shareTrip = async (req, res) => {
    try {
        const trip = await Trip.findOne({
            _id: req.params.tripId,
            userId: req.user._id,
        });

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: "Trip not found",
            });
        }

        const message = `
🚍 BTBS Trip Share

I'm travelling from ${trip.origin.name} to ${trip.destination.name}.

🚌 Transport: ${trip.vehicleType}
📍 Boarding: ${trip.boardingPoint.name}
📍 Drop-off: ${trip.dropOffPoint.name}

💰 Expected fare: ₦${trip.fareLow} - ₦${trip.fareHigh}

⭐ Confidence: ${trip.confidenceScore}% (${trip.confidenceLevel})

Trip status: ${trip.status}

Shared via Beyond The Bus Stop.
        `.trim();
        const shareUrl =
            `${process.env.FRONTEND_URL}/trip/${trip.shareToken}`;
        return res.status(200).json({
            success: true,
            message: "Trip ready to share",
            share: {
                tripId: trip._id,
                shareToken: trip.shareToken,
                shareUrl,
                whatsappMessage: message,
            },
        });

    } catch (error) {
        console.error("Share trip error:", error);

        return res.status(500).json({
            success: false,
            message: "Error preparing trip share",
            error: error.message,
        });
    }
};

const getPublicTrip = async (req, res) => {
    try {
        const trip = await Trip.findOne({
            shareToken: req.params.shareToken,
        }).select(
            "origin destination vehicleType boardingPoint dropOffPoint fareLow fareHigh confidenceScore confidenceLevel status startedAt endedAt currentLocation"
        );

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: "Trip not found",
            });
        }

        return res.status(200).json({
            success: true,
            trip,
        });

    } catch (error) {
        console.error("Public trip error:", error);

        return res.status(500).json({
            success: false,
            message: "Error fetching trip",
            error: error.message,
        });
    }
};

const updateTripLocation = async (req, res) => {
    try {
        const { latitude, longitude } = req.body;

        if (latitude === undefined || longitude === undefined) {
            return res.status(400).json({
                success: false,
                message: "Latitude and longitude are required",
            });
        }

        if (
            latitude < -90 ||
            latitude > 90 ||
            longitude < -180 ||
            longitude > 180
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid coordinates",
            });
        }

        const trip = await Trip.findOne({
            _id: req.params.tripId,
            userId: req.user._id,
        });

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: "Trip not found",
            });
        }

        if (trip.status !== "active") {
            return res.status(400).json({
                success: false,
                message: "Trip is not active",
            });
        }

        trip.currentLocation = {
            latitude,
            longitude,
            updatedAt: new Date(),
        };

        await trip.save();

        const io = req.app.get("io");

        io.to(`trip:${trip.shareToken}`).emit(
            "locationUpdated",
            {
                tripId: trip._id,

                latitude,
                longitude,

                updatedAt:
                    trip.currentLocation.updatedAt,
            }
        );

        return res.status(200).json({
            success: true,
            message: "Location updated",
            location: trip.currentLocation,
        });

    } catch (error) {
        console.error("Update trip location error:", error);

        return res.status(500).json({
            success: false,
            message: "Error updating trip location",
            error: error.message,
        });
    }
};
const getTripLocation = async (req, res) => {
    try {
        const { shareToken } = req.params;

        if (!shareToken) {
            return res.status(400).json({
                success: false,
                message: "Share token is required",
            });
        }

        const trip = await Trip.findOne({
            shareToken,
        }).select(
            "_id shareToken status currentLocation"
        );

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: "Trip not found",
            });
        }

        // ==========================================
        // NO LOCATION YET
        // ==========================================

        if (
            !trip.currentLocation ||
            trip.currentLocation.latitude === undefined ||
            trip.currentLocation.longitude === undefined
        ) {
            return res.status(200).json({
                success: true,
                message: "Location is not available yet",
                location: null,
                status: trip.status,
            });
        }

        // ==========================================
        // RETURN CURRENT LOCATION
        // ==========================================

        return res.status(200).json({
            success: true,

            location: {
                latitude:
                    trip.currentLocation.latitude,

                longitude:
                    trip.currentLocation.longitude,

                updatedAt:
                    trip.currentLocation.updatedAt,
            },

            status: trip.status,
        });

    } catch (error) {
        console.error(
            "Get trip location error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Error fetching trip location",
            error: error.message,
        });
    }
};

const getTripDirections = async (req, res) => {
    try {
        const trip = await Trip.findOne({
            shareToken: req.params.shareToken,
        }).select("origin destination vehicleType");

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: "Trip not found",
            });
        }

        const directions = await getRouteDirections(
            trip.origin.placeId,
            trip.destination.placeId,
            trip.vehicleType
        );

        return res.status(200).json({
            success: true,
            directions,
        });

    } catch (error) {
        console.error("Get trip directions error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Error fetching trip directions",
        });
    }
};

module.exports = {
    createTrip,
    getTrip,
    startTrip,
    endTrip,
    shareTrip,
    getPublicTrip,
    updateTripLocation,
    getTripLocation,
    getTripDirections,
};