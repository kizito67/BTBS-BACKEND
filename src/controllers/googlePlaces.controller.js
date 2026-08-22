const {
    searchGooglePlaces,
    searchNearbyPlaces,
    autocompleteGooglePlaces,
    getGooglePlaceDetails,
    reverseGeocodeGoogle,
} = require("../services/googleMaps.service");

const isValidLatitude = (value) =>
    Number.isFinite(value) && value >= -90 && value <= 90;

const isValidLongitude = (value) =>
    Number.isFinite(value) && value >= -180 && value <= 180;

const searchLocations = async (req, res) => {
    try {
        const query = req.query.query?.trim();

        if (!query || query.length < 2) {
            return res.status(400).json({
                success: false,
                message: "Query must contain at least 2 characters",
            });
        }

        const places = await autocompleteGooglePlaces(query);

        return res.status(200).json({
            success: true,
            count: places.length,
            places,
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Unable to search locations",
        });
    }
};

const searchNearby = async (req, res) => {
    try {
        const latitude = Number(req.query.latitude);
        const longitude = Number(req.query.longitude);
        const type = req.query.type?.trim().toLowerCase();
        const requestedRadius = Number(req.query.radius);
        const radius = Number.isFinite(requestedRadius)
            ? requestedRadius
            : 5000;

        if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) {
            return res.status(400).json({
                success: false,
                message: "Valid latitude and longitude are required",
            });
        }

        if (!type) {
            return res.status(400).json({
                success: false,
                message: "A place type is required",
            });
        }

        if (radius < 1 || radius > 50000) {
            return res.status(400).json({
                success: false,
                message: "Radius must be between 1 and 50000 metres",
            });
        }

        const places = await searchNearbyPlaces(
            latitude,
            longitude,
            type,
            radius
        );

        return res.status(200).json({
            success: true,
            count: places.length,
            places,
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Unable to search nearby places",
        });
    }
};

const autocompleteLocations = async (req, res) => {
    try {
        const input =
            req.query.input?.trim();

        if (!input || input.length < 2) {
            return res.status(400).json({
                success: false,
                message:
                    "Input must contain at least 2 characters",
            });
        }

        const places =
            await autocompleteGooglePlaces(
                input
            );

        return res.status(200).json({
            success: true,
            count: places.length,
            places,
        });

    } catch (error) {
        console.error(
            "Autocomplete error:",
            error
        );

        return res.status(
            error.statusCode || 500
        ).json({
            success: false,
            message:
                error.message ||
                "Unable to autocomplete locations",
        });
    }
};




const getPlaceDetails = async (req, res) => {
    try {
        const { placeId } = req.params;

        if (!placeId) {
            return res.status(400).json({
                success: false,
                message:
                    "Place ID is required",
            });
        }

        const place =
            await getGooglePlaceDetails(
                placeId
            );

        return res.status(200).json({
            success: true,
            place,
        });

    } catch (error) {
        console.error(
            "Place details error:",
            error
        );

        return res.status(
            error.statusCode || 500
        ).json({
            success: false,
            message:
                error.message ||
                "Unable to get place details",
        });
    }
};
const reverseGeocode = async (req, res) => {
    try {
        const latitude = Number(req.query.lat);
        const longitude = Number(req.query.lng);

        if (
            !isValidLatitude(latitude) ||
            !isValidLongitude(longitude)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Valid latitude and longitude are required",
            });
        }

        const location = await reverseGeocodeGoogle(
            latitude,
            longitude
        );

        return res.status(200).json({
            success: true,
            location,
        });

    } catch (error) {
        console.error(
            "Reverse geocoding error:",
            error
        );

        return res.status(
            error.statusCode || 500
        ).json({
            success: false,
            message:
                error.message ||
                "Unable to reverse geocode location",
        });
    }
};

module.exports = {
    searchLocations,
    searchNearby,
    autocompleteLocations,
    getPlaceDetails,
    reverseGeocode,
};