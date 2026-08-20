const axios = require("axios");

const GOOGLE_PLACES_BASE_URL = "https://places.googleapis.com/v1";
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

const PLACE_FIELD_MASK = [
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.location",
    "places.types",
    "places.rating",
    "places.userRatingCount",
    "places.currentOpeningHours",
].join(",");

const allowedNearbyTypes = new Set([
    "hospital",
    "police",
    "market",
]);

const createGooglePlacesError = (message, statusCode = 502) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const assertGoogleApiKey = () => {
    if (!GOOGLE_MAPS_API_KEY) {
        throw createGooglePlacesError(
            "Google Places service is not configured",
            503
        );
    }
};

const calculateDistanceKm = (lat1, lng1, lat2, lng2) => {
    const earthRadiusKm = 6371;
    const toRadians = (value) => (value * Math.PI) / 180;

    const latitudeDifference = toRadians(lat2 - lat1);
    const longitudeDifference = toRadians(lng2 - lng1);

    const a =
        Math.sin(latitudeDifference / 2) ** 2 +
        Math.cos(toRadians(lat1)) *
            Math.cos(toRadians(lat2)) *
            Math.sin(longitudeDifference / 2) ** 2;

    return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatPlace = (place, origin) => {
    const latitude = place.location?.latitude;
    const longitude = place.location?.longitude;

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return null;
    }

    const distance =
        origin &&
        calculateDistanceKm(
            origin.latitude,
            origin.longitude,
            latitude,
            longitude
        );

    return {
        placeId: place.id,
        name: place.displayName?.text || "",
        address: place.formattedAddress || "",
        location: {
            latitude,
            longitude,
        },
        types: place.types || [],
        rating: place.rating ?? null,
        userRatingsTotal: place.userRatingCount ?? 0,
        openNow: place.currentOpeningHours?.openNow ?? null,
        ...(distance !== undefined && {
            distance: Number(distance.toFixed(2)),
            distanceUnit: "km",
        }),
    };
};

const googlePlacesRequest = async (path, body) => {
    assertGoogleApiKey();

    try {
        const response = await axios.post(
            `${GOOGLE_PLACES_BASE_URL}${path}`,
            body,
            {
                timeout: 10000,
                headers: {
                    "Content-Type": "application/json",
                    "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
                    "X-Goog-FieldMask": PLACE_FIELD_MASK,
                },
            }
        );

        return response.data.places || [];
    } catch (error) {
        console.error(
            "Google Places request failed:",
            error.response?.data || error.message
        );

        const googleStatus = error.response?.status;

        if (googleStatus === 400) {
            throw createGooglePlacesError(
                "Google Places rejected the search parameters",
                400
            );
        }

        if (googleStatus === 401 || googleStatus === 403) {
            throw createGooglePlacesError(
                "Google Places API key is invalid or not authorized",
                503
            );
        }

        throw createGooglePlacesError("Unable to search Google Places");
    }
};

const searchGooglePlaces = async (query) => {
    const places = await googlePlacesRequest("/places:searchText", {
        textQuery: `${query}, Lagos, Nigeria`,
        languageCode: "en",
        regionCode: "NG",
        pageSize: 10,
        locationBias: {
            rectangle: {
                low: {
                    latitude: 6.35,
                    longitude: 3.2,
                },
                high: {
                    latitude: 6.75,
                    longitude: 3.7,
                },
            },
        },
    });

    return places.map((place) => formatPlace(place)).filter(Boolean);
};


const autocompleteGooglePlaces = async (input) => {
    assertGoogleApiKey();

    try {
        const response = await axios.post(
            `${GOOGLE_PLACES_BASE_URL}/places:autocomplete`,
            {
                input,

                languageCode: "en",

                includedRegionCodes: ["ng"],

                locationBias: {
                    rectangle: {
                        low: {
                            latitude: 6.35,
                            longitude: 3.2,
                        },
                        high: {
                            latitude: 6.75,
                            longitude: 3.7,
                        },
                    },
                },
            },
            {
                timeout: 10000,

                headers: {
                    "Content-Type": "application/json",
                    "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
                },
            }
        );

        const suggestions =
            response.data.suggestions || [];

        return suggestions
            .map((suggestion) => {
                const prediction =
                    suggestion.placePrediction;

                if (!prediction) {
                    return null;
                }

                return {
                    placeId:
                        prediction.placeId,

                    name:
                        prediction
                            .structuredFormat
                            ?.mainText
                            ?.text ||
                        prediction.text?.text ||
                        "",

                    description:
                        prediction
                            .structuredFormat
                            ?.secondaryText
                            ?.text ||
                        prediction.text?.text ||
                        "",
                };
            })
            .filter(Boolean);

    } catch (error) {
        console.error(
            "Google Places autocomplete failed:",
            error.response?.data ||
                error.message
        );

        const googleStatus =
            error.response?.status;

        if (googleStatus === 400) {
            throw createGooglePlacesError(
                "Google Places rejected the autocomplete request",
                400
            );
        }

        if (
            googleStatus === 401 ||
            googleStatus === 403
        ) {
            throw createGooglePlacesError(
                "Google Places API key is invalid or not authorized",
                503
            );
        }

        throw createGooglePlacesError(
            "Unable to search Google Places"
        );
    }
};



const getGooglePlaceDetails = async (placeId) => {
    assertGoogleApiKey();

    try {
        const response = await axios.get(
            `${GOOGLE_PLACES_BASE_URL}/places/${encodeURIComponent(
                placeId
            )}`,
            {
                timeout: 10000,

                headers: {
                    "X-Goog-Api-Key":
                        GOOGLE_MAPS_API_KEY,

                    "X-Goog-FieldMask": [
                        "id",
                        "displayName",
                        "formattedAddress",
                        "location",
                        "types",
                    ].join(","),
                },
            }
        );

        const place = response.data;

        const latitude =
            place.location?.latitude;

        const longitude =
            place.location?.longitude;

        if (
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude)
        ) {
            throw createGooglePlacesError(
                "Selected place does not have valid coordinates",
                404
            );
        }

        return {
            placeId: place.id,

            name:
                place.displayName?.text ||
                "",

            address:
                place.formattedAddress ||
                "",

            lat: latitude,

            lng: longitude,

            location: {
                latitude,
                longitude,
            },

            types:
                place.types || [],
        };

    } catch (error) {
        console.error(
            "Google Place details failed:",
            error.response?.data ||
                error.message
        );

        if (error.statusCode) {
            throw error;
        }

        const googleStatus =
            error.response?.status;

        if (googleStatus === 404) {
            throw createGooglePlacesError(
                "Place not found",
                404
            );
        }

        if (
            googleStatus === 401 ||
            googleStatus === 403
        ) {
            throw createGooglePlacesError(
                "Google Places API key is invalid or not authorized",
                503
            );
        }

        throw createGooglePlacesError(
            "Unable to retrieve place details"
        );
    }
};


const searchNearbyPlaces = async (latitude, longitude, type, radius = 5000) => {
    if (!allowedNearbyTypes.has(type)) {
        throw createGooglePlacesError(
            "Invalid place type. Use hospital, police, or market.",
            400
        );
    }

    const places = await googlePlacesRequest("/places:searchNearby", {
        includedTypes: [type],
        maxResultCount: 20,
        locationRestriction: {
            circle: {
                center: {
                    latitude,
                    longitude,
                },
                radius,
            },
        },
        languageCode: "en",
    });

    return places
        .map((place) =>
            formatPlace(place, {
                latitude,
                longitude,
            })
        )
        .filter(Boolean)
        .sort((firstPlace, secondPlace) => firstPlace.distance - secondPlace.distance);
};

module.exports = {
    searchGooglePlaces,
    searchNearbyPlaces,
    autocompleteGooglePlaces,
    getGooglePlaceDetails,
};