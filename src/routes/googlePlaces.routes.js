const express = require("express");

const {
    searchLocations,
    searchNearby,
    autocompleteLocations,
    getPlaceDetails,
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


module.exports = router;