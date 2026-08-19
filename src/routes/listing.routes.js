const express = require("express");

const router = express.Router();

const {
    createListing,
    getMyListings,
    getPublicListings,
    getListingById,
    uploadListingPhotos,
} = require("../controllers/listing.controller");

const {
    protect,
} = require("../middleware/auth.middleware");
const upload = require("../middleware/upload.middleware");


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

router.get(
  "/",
  getPublicListings
);

router.post(
  "/upload",
  protect,
  upload.array("photos", 5),
  uploadListingPhotos
);


router.get(
  "/:listingId",
  getListingById
);



module.exports = router;