const express = require("express");

const router = express.Router();

const {
    createListing,
    getMyListings,
} = require("../controllers/listing.controller");

const {
    protect,
} = require("../middleware/auth.middleware");



router.post(
    "/",
    protect,
    createListing
);


router.get(
    "/my",
    protect,
    getMyListings
);




module.exports = router;