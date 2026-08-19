const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/auth.middleware");

const routeController = require("../controllers/route.controller");

const RouteValidator = require("../validators/route.validation");
const validate = require("../middleware/validation.middleware");
const { validateObjectId } = require("../middleware/objectId.middleware");


// ==========================================
// PUBLIC ROUTES
// ==========================================

router.get("/search", routeController.searchRoutes);

router.get("/:id", validateObjectId('id'), routeController.getRoutesById);

router.get("/", routeController.getAllRoutes);

// ==========================================
// PROTECTED ROUTES
// ==========================================

router.post(
    "/create",
    (req, res, next) => {
        console.log("/api/routes/create ROUTE HIT");
        next();
    },
    protect,
    RouteValidator.createRouteValidation,
    validate,
    routeController.createRoute
);

router.put(
    "/:id",
    protect,
    authorize("business", "admin"),
    validateObjectId('id'),
    RouteValidator.updateRouteValidation,
    validate,
    routeController.updateRoute
);

router.delete(
    "/:id",
    protect,
    authorize("admin"),
    validateObjectId('id'),
    routeController.deleteRoute
);

module.exports = router;