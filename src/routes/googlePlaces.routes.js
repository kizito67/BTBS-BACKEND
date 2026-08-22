const express = require("express");

const {
    searchLocations,
    searchNearby,
    autocompleteLocations,
    getPlaceDetails,
    reverseGeocode,
} = require("../controllers/googlePlaces.controller");

const router = express.Router();


// ==========================================
// AUTOCOMPLETE
// ==========================================

router.get(
    "/autocomplete",
    autocompleteLocations
);


// ==========================================
// PLACE DETAILS
// ==========================================

router.get(
    "/details/:placeId",
    getPlaceDetails
);


// ==========================================
// TEXT SEARCH
// ==========================================

router.get(
    "/search",
    searchLocations
);


// ==========================================
// NEARBY SEARCH
// ==========================================

router.get(
    "/nearby",
    searchNearby
);


router.get(
    "/reverse-geocode",
    reverseGeocode
);


module.exports = router;