const express = require("express");
const trackingController = require("./tracking.controller");

const router = express.Router();

router.post("/", trackingController.receiveEvent);

module.exports = router;
