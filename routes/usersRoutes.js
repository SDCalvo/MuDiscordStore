const express = require("express");
const router = express.Router();

// Set up Express routes
router.get("/", (req, res) => {
  res.send("Hello World!");
});

module.exports = router;
