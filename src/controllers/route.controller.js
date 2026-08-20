const Route = require("../models/route.model");
const Confirmation = require("../models/confirmation.model");

// ==========================================
// CREATE ROUTE
// ==========================================

const createRoute = async (req, res) => {
    try {
        console.log("🔥 CREATE ROUTE HIT");
        console.log("🔥 REQUEST BODY:", req.body);

        const {
            origin,
            destination,
            vehicleType,
            boardingPoint,
            transferPoint,
            dropOffPoint,
            fareLow,
            fareHigh,
            averageFare,
        } = req.body;

        // ==========================================
        // VALIDATE ORIGIN
        // ==========================================

        if (!origin || typeof origin !== "object") {
            return res.status(400).json({
                success: false,
                message: "Origin must be an object",
            });
        }

        if (
            !origin.placeId ||
            !origin.name ||
            origin.lat === undefined ||
            origin.lng === undefined
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Origin must contain placeId, name, lat and lng",
            });
        }

        const originLat = Number(origin.lat);
        const originLng = Number(origin.lng);

        if (
            !Number.isFinite(originLat) ||
            !Number.isFinite(originLng)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid origin coordinates",
            });
        }

        if (
            originLat < -90 ||
            originLat > 90 ||
            originLng < -180 ||
            originLng > 180
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid origin coordinates",
            });
        }

        // ==========================================
        // VALIDATE DESTINATION
        // ==========================================

        if (
            !destination ||
            typeof destination !== "object"
        ) {
            return res.status(400).json({
                success: false,
                message: "Destination must be an object",
            });
        }

        if (
            !destination.placeId ||
            !destination.name ||
            destination.lat === undefined ||
            destination.lng === undefined
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Destination must contain placeId, name, lat and lng",
            });
        }

        const destinationLat = Number(destination.lat);
        const destinationLng = Number(destination.lng);

        if (
            !Number.isFinite(destinationLat) ||
            !Number.isFinite(destinationLng)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid destination coordinates",
            });
        }

        if (
            destinationLat < -90 ||
            destinationLat > 90 ||
            destinationLng < -180 ||
            destinationLng > 180
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid destination coordinates",
            });
        }

        // ==========================================
        // VALIDATE VEHICLE
        // ==========================================

        if (!vehicleType) {
            return res.status(400).json({
                success: false,
                message: "Vehicle type is required",
            });
        }

        const normalizedVehicleType =
            vehicleType.toLowerCase();

        const allowedVehicles = [
            "bus",
            "keke",
            "taxi",
        ];

        if (
            !allowedVehicles.includes(
                normalizedVehicleType
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Vehicle type must be bus, keke, or taxi",
            });
        }

        // ==========================================
        // VALIDATE BOARDING POINT
        // ==========================================

        if (
            !boardingPoint ||
            typeof boardingPoint !== "object"
        ) {
            return res.status(400).json({
                success: false,
                message: "Boarding point is required",
            });
        }

        if (!boardingPoint.name) {
            return res.status(400).json({
                success: false,
                message:
                    "Boarding point must contain name",
            });
        }

        // ==========================================
        // VALIDATE DROP-OFF POINT
        // ==========================================

        if (
            !dropOffPoint ||
            typeof dropOffPoint !== "object"
        ) {
            return res.status(400).json({
                success: false,
                message: "Drop-off point is required",
            });
        }

        if (!dropOffPoint.name) {
            return res.status(400).json({
                success: false,
                message:
                    "Drop-off point must contain name",
            });
        }

        // ==========================================
        // VALIDATE TRANSFER POINT
        // ==========================================

        if (transferPoint !== undefined) {
            if (
                transferPoint === null ||
                typeof transferPoint !== "object"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Transfer point must be an object",
                });
            }

            if (!transferPoint.name) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Transfer point must contain name",
                });
            }
        }

        // ==========================================
        // VALIDATE FARES
        // ==========================================

        const low = Number(fareLow);
        const high = Number(fareHigh);

        if (
            !Number.isFinite(low) ||
            !Number.isFinite(high)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "fareLow and fareHigh must be valid numbers",
            });
        }

        if (low < 0 || high < 0) {
            return res.status(400).json({
                success: false,
                message:
                    "Fare values cannot be negative",
            });
        }

        if (high < low) {
            return res.status(400).json({
                success: false,
                message:
                    "fareHigh cannot be lower than fareLow",
            });
        }

        // ==========================================
        // CALCULATE AVERAGE FARE
        // ==========================================

        const calculatedAverageFare =
            averageFare !== undefined
                ? Number(averageFare)
                : (low + high) / 2;

        if (
            !Number.isFinite(
                calculatedAverageFare
            ) ||
            calculatedAverageFare < 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Average fare must be a valid number",
            });
        }

        // ==========================================
        // CREATE ROUTE DATA
        // ==========================================

        const routeData = {
            origin: {
                placeId: origin.placeId,
                name: origin.name,
                lat: originLat,
                lng: originLng,
            },

            destination: {
                placeId: destination.placeId,
                name: destination.name,
                lat: destinationLat,
                lng: destinationLng,
            },

            vehicleType:
                normalizedVehicleType,

            boardingPoint: {
                placeId:
                    boardingPoint.placeId ||
                    undefined,
                name: boardingPoint.name,
            },

            transferPoint: transferPoint
                ? {
                      placeId:
                          transferPoint.placeId ||
                          undefined,
                      name: transferPoint.name,
                  }
                : undefined,

            dropOffPoint: {
                placeId:
                    dropOffPoint.placeId ||
                    undefined,
                name: dropOffPoint.name,
            },

            fareLow: low,

            fareHigh: high,

            averageFare:
                calculatedAverageFare,

            totalConfirmations: 0,

            confidenceScore: 0,

            confidenceLevel:
                "Unconfirmed",

            createdBy: req.user._id,
        };

        console.log(
            "🔥 FINAL ROUTE DATA:"
        );

        console.log(
            JSON.stringify(
                routeData,
                null,
                2
            )
        );

        // ==========================================
        // SAVE ROUTE
        // ==========================================

        const newRoute =
            await Route.create(routeData);

        console.log(
            "🔥 ROUTE CREATED:",
            newRoute._id
        );

        // ==========================================
        // RESPONSE
        // ==========================================

        return res.status(201).json({
            success: true,

            message:
                "Route created successfully",

            route: {
                id: newRoute._id,

                origin:
                    newRoute.origin,

                destination:
                    newRoute.destination,

                vehicleType:
                    newRoute.vehicleType,

                boardingPoint:
                    newRoute.boardingPoint,

                transferPoint:
                    newRoute.transferPoint ||
                    null,

                dropOffPoint:
                    newRoute.dropOffPoint,

                fare: {
                    low:
                        newRoute.fareLow,

                    high:
                        newRoute.fareHigh,

                    average:
                        newRoute.averageFare,
                },

                confidence: {
                    score:
                        newRoute.confidenceScore,

                    level:
                        newRoute.confidenceLevel,
                },

                totalConfirmations:
                    newRoute.totalConfirmations,

                createdBy:
                    newRoute.createdBy,

                createdAt:
                    newRoute.createdAt,

                updatedAt:
                    newRoute.updatedAt,
            },
        });

    } catch (error) {
        console.error(
            "🔥 CREATE ROUTE ERROR:",
            error
        );

        return res.status(500).json({
            success: false,

            message:
                "Error creating route",

            error:
                error.message,
        });
    }
};


// ==========================================
// SEARCH ROUTES
// ==========================================

const searchRoutes = async (req, res) => {
    console.log("🔥 searchRoutes HIT");
    console.log("QUERY:", req.query);

    try {
        const {
            originLat,
            originLng,
            destinationLat,
            destinationLng,
            vehicleType,
            radius,
        } = req.query;

        // ==========================================
        // VALIDATE REQUIRED COORDINATES
        // ==========================================

        if (
            originLat === undefined ||
            originLng === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "Origin coordinates are required",
            });
        }

        if (
            destinationLat === undefined ||
            destinationLng === undefined
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Destination coordinates are required",
            });
        }

        // ==========================================
        // CONVERT TO NUMBERS
        // ==========================================

        const userOriginLat = Number(originLat);
        const userOriginLng = Number(originLng);

        const userDestinationLat =
            Number(destinationLat);

        const userDestinationLng =
            Number(destinationLng);

        // ==========================================
        // VALIDATE NUMBERS
        // ==========================================

        if (
            !Number.isFinite(userOriginLat) ||
            !Number.isFinite(userOriginLng) ||
            !Number.isFinite(userDestinationLat) ||
            !Number.isFinite(userDestinationLng)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Coordinates must be valid numbers",
            });
        }

        // ==========================================
        // VALIDATE ORIGIN RANGE
        // ==========================================

        if (
            userOriginLat < -90 ||
            userOriginLat > 90 ||
            userOriginLng < -180 ||
            userOriginLng > 180
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid origin coordinates",
            });
        }

        // ==========================================
        // VALIDATE DESTINATION RANGE
        // ==========================================

        if (
            userDestinationLat < -90 ||
            userDestinationLat > 90 ||
            userDestinationLng < -180 ||
            userDestinationLng > 180
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid destination coordinates",
            });
        }

        // ==========================================
        // SEARCH RADIUS
        // ==========================================

        let searchRadiusKm = 5;

        if (radius !== undefined) {
            const requestedRadius = Number(radius);

            if (
                !Number.isFinite(requestedRadius) ||
                requestedRadius <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Radius must be a positive number",
                });
            }

            // Prevent extremely large searches
            searchRadiusKm = Math.min(
                requestedRadius,
                20
            );
        }

        // ==========================================
        // BUILD DATABASE FILTER
        // ==========================================

        const filter = {};

        if (vehicleType) {
            const normalizedVehicleType =
                vehicleType.toLowerCase();

            const allowedVehicles = [
                "bus",
                "keke",
                "taxi",
            ];

            if (
                !allowedVehicles.includes(
                    normalizedVehicleType
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Vehicle type must be bus, keke, or taxi",
                });
            }

            filter.vehicleType =
                normalizedVehicleType;
        }

        // ==========================================
        // GET ROUTES
        // ==========================================

        const routes = await Route.find(filter)
            .lean();

        // ==========================================
        // DISTANCE FUNCTION
        // ==========================================

        const getDistanceInKm = (
            lat1,
            lng1,
            lat2,
            lng2
        ) => {
            const earthRadius = 6371;

            const dLat =
                ((lat2 - lat1) * Math.PI) / 180;

            const dLng =
                ((lng2 - lng1) * Math.PI) / 180;

            const lat1Rad =
                (lat1 * Math.PI) / 180;

            const lat2Rad =
                (lat2 * Math.PI) / 180;

            const a =
                Math.sin(dLat / 2) ** 2 +
                Math.cos(lat1Rad) *
                    Math.cos(lat2Rad) *
                    Math.sin(dLng / 2) ** 2;

            const c =
                2 *
                Math.atan2(
                    Math.sqrt(a),
                    Math.sqrt(1 - a)
                );

            return earthRadius * c;
        };

        // ==========================================
        // FIND MATCHING ROUTES
        // ==========================================

        const matchedRoutes = routes
            .map((route) => {

                // Route must have valid coordinates
                if (
                    !route.origin ||
                    !route.destination ||
                    !Number.isFinite(
                        route.origin.lat
                    ) ||
                    !Number.isFinite(
                        route.origin.lng
                    ) ||
                    !Number.isFinite(
                        route.destination.lat
                    ) ||
                    !Number.isFinite(
                        route.destination.lng
                    )
                ) {
                    return null;
                }

                // Distance from user's origin
                // to route's origin
                const originDistance =
                    getDistanceInKm(
                        userOriginLat,
                        userOriginLng,
                        route.origin.lat,
                        route.origin.lng
                    );

                // Distance from user's destination
                // to route's destination
                const destinationDistance =
                    getDistanceInKm(
                        userDestinationLat,
                        userDestinationLng,
                        route.destination.lat,
                        route.destination.lng
                    );

                // Combined distance
                const totalDistance =
                    originDistance +
                    destinationDistance;

                return {
                    route,
                    originDistance,
                    destinationDistance,
                    totalDistance,
                };
            })
            .filter(Boolean)

            // ==========================================
            // ONLY KEEP NEARBY ROUTES
            // ==========================================

            .filter((item) => {
                return (
                    item.originDistance <=
                        searchRadiusKm &&
                    item.destinationDistance <=
                        searchRadiusKm
                );
            });

        // ==========================================
        // SORT ROUTES
        // ==========================================

        matchedRoutes.sort((a, b) => {

            // ------------------------------------------
            // 1. TOTAL DISTANCE
            // ------------------------------------------

            if (
                a.totalDistance !==
                b.totalDistance
            ) {
                return (
                    a.totalDistance -
                    b.totalDistance
                );
            }

            // ------------------------------------------
            // 2. CONFIDENCE SCORE
            // ------------------------------------------

            if (
                b.route.confidenceScore !==
                a.route.confidenceScore
            ) {
                return (
                    b.route.confidenceScore -
                    a.route.confidenceScore
                );
            }

            // ------------------------------------------
            // 3. CONFIRMATIONS
            // ------------------------------------------

            return (
                b.route.totalConfirmations -
                a.route.totalConfirmations
            );
        });

        // ==========================================
        // FORMAT RESPONSE
        // ==========================================

        const formattedRoutes =
            matchedRoutes.map(
                (item, index) => {

                    const route =
                        item.route;

                    return {
                        id: route._id,

                        recommended:
                            index === 0,

                        // ==================================
                        // MATCH INFORMATION
                        // ==================================

                        match: {
                            originDistanceKm:
                                Number(
                                    item.originDistance.toFixed(
                                        2
                                    )
                                ),

                            destinationDistanceKm:
                                Number(
                                    item.destinationDistance.toFixed(
                                        2
                                    )
                                ),

                            totalDistanceKm:
                                Number(
                                    item.totalDistance.toFixed(
                                        2
                                    )
                                ),
                        },

                        // ==================================
                        // ORIGIN
                        // ==================================

                        origin: {
                            placeId:
                                route.origin.placeId,

                            name:
                                route.origin.name,

                            lat:
                                route.origin.lat,

                            lng:
                                route.origin.lng,
                        },

                        // ==================================
                        // DESTINATION
                        // ==================================

                        destination: {
                            placeId:
                                route.destination
                                    .placeId,

                            name:
                                route.destination
                                    .name,

                            lat:
                                route.destination
                                    .lat,

                            lng:
                                route.destination
                                    .lng,
                        },

                        // ==================================
                        // VEHICLE
                        // ==================================

                        vehicleType:
                            route.vehicleType,

                        // ==================================
                        // ROUTE GUIDANCE
                        // ==================================

                        guidance: {
                            boarding:
                                route.boardingPoint
                                    ?.name || null,

                            transfer:
                                route.transferPoint
                                    ?.name || null,

                            dropOff:
                                route.dropOffPoint
                                    ?.name || null,
                        },

                        // ==================================
                        // FARE
                        // ==================================

                        fare: {
                            low:
                                route.fareLow,

                            high:
                                route.fareHigh,

                            average:
                                route.averageFare,
                        },

                        // ==================================
                        // CONFIDENCE
                        // ==================================

                        confidence: {
                            score:
                                route.confidenceScore,

                            level:
                                route.confidenceLevel,
                        },

                        // ==================================
                        // CONFIRMATIONS
                        // ==================================

                        totalConfirmations:
                            route.totalConfirmations,

                        lastConfirmedAt:
                            route.lastConfirmedAt,

                        createdAt:
                            route.createdAt,

                        updatedAt:
                            route.updatedAt,
                    };
                }
            );

        // ==========================================
        // NO ROUTES FOUND
        // ==========================================

        if (
            formattedRoutes.length === 0
        ) {
            return res.status(200).json({
                success: true,

                count: 0,

                routes: [],

                canCreateRoute: true,

                searchRadiusKm,

                message:
                    "No route found near the selected locations.",
            });
        }

        // ==========================================
        // SUCCESS RESPONSE
        // ==========================================

        return res.status(200).json({
            success: true,

            count:
                formattedRoutes.length,

            canCreateRoute: false,

            searchRadiusKm,

            routes:
                formattedRoutes,
        });

    } catch (error) {

        console.error(
            "🔥 Search routes error:",
            error
        );

        return res.status(500).json({
            success: false,

            message:
                "Error searching routes",

            error:
                error.message,
        });
    }
};

// ==========================================
// GET ROUTE BY ID
// ==========================================

const getRoutesById = async (req, res) => {
    try {
        const route =
            await Route.findById(req.params.id);

        if (!route) {
            return res.status(404).json({
                success: false,
                message: "Route not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Route found",
            route,
        });

    } catch (error) {
        console.error(
            "Get route error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Error fetching route",
            error:
                error.message,
        });
    }
};


// ==========================================
// GET ALL ROUTES
// ==========================================

const getAllRoutes = async (req, res) => {
    try {
        const routes =
            await Route.find();

        return res.status(200).json({
            success: true,
            count: routes.length,
            routes,
        });

    } catch (error) {
        console.error(
            "Get all routes error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Error fetching routes",
            error:
                error.message,
        });
    }
};


// ==========================================
// UPDATE ROUTE
// ==========================================

const updateRoute = async (req, res) => {
    try {
        const route =
            await Route.findById(req.params.id);

        if (!route) {
            return res.status(404).json({
                success: false,
                message: "Route not found",
            });
        }

        // Business users can only update their own routes
        if (
            req.user.role === "business" &&
            route.createdBy.toString() !==
                req.user._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You can only update routes you created",
            });
        }

        const updatedRoute =
            await Route.findByIdAndUpdate(
                req.params.id,
                req.body,
                {
                    new: true,
                    runValidators: true,
                }
            );

        return res.status(200).json({
            success: true,
            message:
                "Route updated successfully",
            route: updatedRoute,
        });

    } catch (error) {
        console.error(
            "Update route error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Error updating route",
            error:
                error.message,
        });
    }
};


// ==========================================
// DELETE ROUTE
// ==========================================

const deleteRoute = async (req, res) => {
    try {
        const route =
            await Route.findById(req.params.id);

        if (!route) {
            return res.status(404).json({
                success: false,
                message: "Route not found",
            });
        }

        // Delete associated confirmations
        await Confirmation.deleteMany({
            routeId: req.params.id,
        });

        // Delete route
        await Route.findByIdAndDelete(
            req.params.id
        );

        return res.status(200).json({
            success: true,
            message:
                "Route and associated confirmations deleted successfully",
        });

    } catch (error) {
        console.error(
            "Delete route error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Error deleting route",
            error:
                error.message,
        });
    }
};


// ==========================================
// EXPORTS
// ==========================================

module.exports = {
    createRoute,
    searchRoutes,
    getRoutesById,
    getAllRoutes,
    updateRoute,
    deleteRoute,
};