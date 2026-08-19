const Confirmation = require('../models/confirmation.model');
const Route = require('../models/route.model')
const { calculateConfidenceScore } = require("../services/confidence.service");
const mongoose = require('mongoose');

const recalculateRouteAggregates = async (routeId) => {
    const confirmations = await Confirmation.find({ routeId });

    if (confirmations.length === 0) {
        const route = await Route.findById(routeId);
        if (route) {
            route.fareLow = 0;
            route.fareHigh = 0;
            route.averageFare = 0;
            route.totalConfirmations = 0;
            route.confidenceScore = 0;
            route.confidenceLevel = "Unconfirmed";
            await route.save();
        }
        return;
    }

    const fares = confirmations.map(item => item.confirmedFare);
    const fareLow = Math.min(...fares);
    const fareHigh = Math.max(...fares);
    const totalFare = fares.reduce((sum, fare) => sum + fare, 0);
    const averageFare = totalFare / fares.length;

    const confidence = await calculateConfidenceScore(routeId);

    const route = await Route.findById(routeId);
    if (route) {
        route.fareLow = fareLow;
        route.fareHigh = fareHigh;
        route.averageFare = Math.round(averageFare);
        route.totalConfirmations = confirmations.length;
        route.confidenceScore = confidence.score;
        route.confidenceLevel = confidence.level;
        await route.save();
    }
};

const createConfirmation = async (req, res) => {
    try {
        const {
            confirmedFare,
            fareFairness,
            everOvercharged,
            easeFindingTransport,
            notes,
        } = req.body;

        // =========================
        // VALIDATION
        // =========================
        const routeId = req.params.routeId;

        if (!routeId) {
            return res.status(400).json({
                success: false,
                message: "Route ID is required",
            });
        }

        if (
            confirmedFare === undefined ||
            confirmedFare === null
        ) {
            return res.status(400).json({
                success: false,
                message: "Confirmed fare is required",
            });
        }

        if (Number(confirmedFare) < 0) {
            return res.status(400).json({
                success: false,
                message: "Confirmed fare cannot be negative",
            });
        }

        if (
            fareFairness === undefined ||
            fareFairness < 1 ||
            fareFairness > 5
        ) {
            return res.status(400).json({
                success: false,
                message: "Fare fairness must be between 1 and 5",
            });
        }

        if (typeof everOvercharged !== "boolean") {
            return res.status(400).json({
                success: false,
                message:
                    "Ever overcharged must be true or false",
            });
        }

        if (
            easeFindingTransport === undefined ||
            easeFindingTransport < 1 ||
            easeFindingTransport > 5
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Ease finding transport must be between 1 and 5",
            });
        }

        // =========================
        // FIND ROUTE
        // =========================

        const route = await Route.findById(routeId);

        if (!route) {
            return res.status(404).json({
                success: false,
                message: "Route not found",
            });
        }

        // =========================
        // COOLDOWN
        // =========================

        const cooldownMinutes = 30;

        const cooldownTime = new Date(
            Date.now() -
            cooldownMinutes * 60 * 1000
        );

        const recentConfirmation =
            await Confirmation.findOne({
                routeId,
                userId: req.user._id,
                confirmedAt: {
                    $gte: cooldownTime,
                },
            });

        if (recentConfirmation) {
            return res.status(429).json({
                success: false,
                message:
                    `You can only confirm this route once every ${cooldownMinutes} minutes`,
            });
        }

        // =========================
        // CREATE CONFIRMATION
        // =========================

        const confirmation =
            await Confirmation.create({
                routeId,
                userId: req.user._id,
                confirmedFare: Number(confirmedFare),
                confirmedAt: new Date(),

                fareFairness:
                    fareFairness !== undefined
                        ? Number(fareFairness)
                        : undefined,

                everOvercharged,

                easeFindingTransport:
                    easeFindingTransport !== undefined
                        ? Number(easeFindingTransport)
                        : undefined,

                isVerified: false,
                reportSource: "user",
                notes,
            });

        // =========================
        // GET CONFIRMATIONS
        // =========================

        const confirmations =
            await Confirmation.find({
                routeId,
            });

        // =========================
        // UPDATE FARE DATA
        // =========================

        const fares = confirmations.map(
            (item) => item.confirmedFare
        );

        const fareLow = Math.min(...fares);

        const fareHigh = Math.max(...fares);

        const totalFare = fares.reduce(
            (sum, fare) => sum + fare,
            0
        );

        const averageFare =
            totalFare / fares.length;

        route.fareLow = fareLow;

        route.fareHigh = fareHigh;

        route.averageFare =
            Math.round(averageFare);

        route.totalConfirmations =
            confirmations.length;

        route.lastConfirmedAt =
            new Date();

        const confidence =
            await calculateConfidenceScore(routeId);

        route.confidenceScore = confidence.score;

        route.confidenceLevel = confidence.level;

        await route.save();

        // =========================
        // RESPONSE
        // =========================

        return res.status(201).json({
            success: true,

            message:
                "Fare confirmation submitted successfully",

            confirmation: {
                id: confirmation._id,
                routeId: confirmation.routeId,
                userId: confirmation.userId,
                confirmedFare:
                    confirmation.confirmedFare,
                fareFairness:
                    confirmation.fareFairness,
                everOvercharged:
                    confirmation.everOvercharged,
                easeFindingTransport:
                    confirmation.easeFindingTransport,
                confirmedAt:
                    confirmation.confirmedAt,
                isVerified:
                    confirmation.isVerified,
            },

            route: {
                id: route._id,

                fare: {
                    low: route.fareLow,
                    high: route.fareHigh,
                    average:
                        route.averageFare,
                },

                confidence: {
                    score: route.confidenceScore,
                    level: route.confidenceLevel,

                    components: confidence.components,

                    independentReports:
                        confidence.independentReports,

                    totalReports:
                        confidence.totalReports,

                    medianFare:
                        confidence.medianFare,
                },

                totalConfirmations:
                    route.totalConfirmations,

                lastConfirmedAt:
                    route.lastConfirmedAt,
            },
        });
    } catch (error) {
        console.error(
            "🔥 CREATE CONFIRMATION ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Error submitting fare confirmation",
            error: error.message,
        });
    }
};




const updateConfirmation = async (req, res) => {
    try {
        const confirmationId = req.params.confirmationId;

        // Validate confirmation ID format
        if (!mongoose.Types.ObjectId.isValid(confirmationId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid confirmation ID format'
            });
        }

        // Find confirmation
        const confirmation = await Confirmation.findById(confirmationId);
        if (!confirmation) {
            return res.status(404).json({
                success: false,
                message: 'Confirmation not found'
            });
        }

        // Authorization: owner or admin
        if (confirmation.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this confirmation'
            });
        }

        // Define allowed fields for update
        const allowedFields = ['confirmedFare', 'fareFairness', 'everOvercharged', 'easeFindingTransport', 'notes'];
        const adminOnlyFields = ['isVerified', 'reportSource'];

        // Build update object with only allowed fields
        const updateData = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        }

        // Add admin-only fields if user is admin
        if (req.user.role === 'admin') {
            for (const field of adminOnlyFields) {
                if (req.body[field] !== undefined) {
                    updateData[field] = req.body[field];
                }
            }
        }

        // Validate numeric/rating fields with same constraints as creation
        if (updateData.confirmedFare !== undefined) {
            if (Number(updateData.confirmedFare) < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Confirmed fare cannot be negative'
                });
            }
            updateData.confirmedFare = Number(updateData.confirmedFare);
        }

        if (updateData.fareFairness !== undefined) {
            if (updateData.fareFairness < 1 || updateData.fareFairness > 5) {
                return res.status(400).json({
                    success: false,
                    message: 'Fare fairness must be between 1 and 5'
                });
            }
            updateData.fareFairness = Number(updateData.fareFairness);
        }

        if (updateData.everOvercharged !== undefined) {
            if (typeof updateData.everOvercharged !== 'boolean') {
                return res.status(400).json({
                    success: false,
                    message: 'Ever overcharged must be true or false'
                });
            }
        }

        if (updateData.easeFindingTransport !== undefined) {
            if (updateData.easeFindingTransport < 1 || updateData.easeFindingTransport > 5) {
                return res.status(400).json({
                    success: false,
                    message: 'Ease finding transport must be between 1 and 5'
                });
            }
            updateData.easeFindingTransport = Number(updateData.easeFindingTransport);
        }

        // Update confirmation
        const updatedConfirmation = await Confirmation.findByIdAndUpdate(
            confirmationId,
            updateData,
            { new: true, runValidators: true }
        );

        // Recalculate route aggregates
        await recalculateRouteAggregates(confirmation.routeId);

        // Get updated route
        const route = await Route.findById(confirmation.routeId);
        const confidence = await calculateConfidenceScore(confirmation.routeId);

        // Response with updated confirmation and refreshed route
        return res.status(200).json({
            success: true,
            message: 'Confirmation updated successfully',
            confirmation: {
                id: updatedConfirmation._id,
                routeId: updatedConfirmation.routeId,
                userId: updatedConfirmation.userId,
                confirmedFare: updatedConfirmation.confirmedFare,
                fareFairness: updatedConfirmation.fareFairness,
                everOvercharged: updatedConfirmation.everOvercharged,
                easeFindingTransport: updatedConfirmation.easeFindingTransport,
                confirmedAt: updatedConfirmation.confirmedAt,
                isVerified: updatedConfirmation.isVerified,
                notes: updatedConfirmation.notes
            },
            route: {
                id: route._id,
                fare: {
                    low: route.fareLow,
                    high: route.fareHigh,
                    average: route.averageFare
                },
                confidence: {
                    score: route.confidenceScore,
                    level: route.confidenceLevel,
                    components: confidence.components,
                    independentReports: confidence.independentReports,
                    totalReports: confidence.totalReports,
                    medianFare: confidence.medianFare
                },
                totalConfirmations: route.totalConfirmations,
                lastConfirmedAt: route.lastConfirmedAt
            }
        });
    } catch (error) {
        console.error('Update confirmation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating confirmation',
            error: error.message
        });
    }
};



const deleteConfirmation = async (req, res) => {
    try {
        const { confirmationId } = req.params;

        const confirmation = await Confirmation.findById(req.params.confirmationId);
        if (!confirmation) {
            return res.status(404).json({ message: 'Confirmation not found' });
        }
        if (confirmation.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'You are not authorized to delete this confirmation' });
        }
        await confirmation.deleteOne();

        res.status(200).json({ message: 'Confirmation deleted', confirmation });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting confirmation', error });
    }
};

const getRouteConfirmations = async (req, res) => {
    console.log("===GET ROUTE CONFIRMATIONS===");
    console.log(req.params);
    try {
        const { routeId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(routeId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid route ID format'
            });
        }
        const confirmations = await Confirmation.find({ routeId }).populate('userId', 'fullName');
        if (confirmations.length === 0) {
            return res.status(200).json({ success: true, count: 0, message: 'No confirmations found for the specified route' });
        }
        res.status(200).json({ success: true, count: confirmations.length, confirmations });
    } catch (error) {
        console.error("Get route confirmations error:", error);
        res.status(500).json({
            success: false,
            message: 'Error fetching confirmations',
            error: error.message
        });
    }
};




module.exports = {
    createConfirmation,
    getRouteConfirmations,
    updateConfirmation,
    deleteConfirmation
};
