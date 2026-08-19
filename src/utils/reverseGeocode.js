const axios = require("axios");

const reverseGeocode = async (lat, lng) => {
    try {
        const response = await axios.get(
            "https://maps.googleapis.com/maps/api/geocode/json",
            {
                params: {
                    latlng: `${lat},${lng}`,
                    key: process.env.GOOGLE_MAPS_API_KEY,
                },
            }
        );

        if (
            response.data.status !== "OK" ||
            !response.data.results?.length
        ) {
            console.log(
                "Google reverse geocoding failed:",
                response.data.status
            );

            return null;
        }

        const result =
            response.data.results[0];

        const components =
            result.address_components || [];

        // ==========================================
        // FIND AREA / NEIGHBORHOOD
        // ==========================================

        const areaComponent =
            components.find((component) =>
                component.types.includes(
                    "neighborhood"
                )
            ) ||
            components.find((component) =>
                component.types.includes(
                    "sublocality"
                )
            ) ||
            components.find((component) =>
                component.types.includes(
                    "sublocality_level_1"
                )
            );

        // ==========================================
        // FIND CITY
        // ==========================================

        const cityComponent =
            components.find((component) =>
                component.types.includes(
                    "locality"
                )
            );

        // ==========================================
        // FIND STATE
        // ==========================================

        const stateComponent =
            components.find((component) =>
                component.types.includes(
                    "administrative_area_level_1"
                )
            );

        return {
            area:
                areaComponent?.long_name ||
                cityComponent?.long_name ||
                "Unknown",

            city:
                cityComponent?.long_name ||
                null,

            state:
                stateComponent?.long_name ||
                null,

            formattedAddress:
                result.formatted_address ||
                null,
        };

    } catch (error) {
        console.error(
            "Reverse geocoding error:",
            error.response?.data ||
                error.message
        );

        return null;
    }
};

module.exports = reverseGeocode;