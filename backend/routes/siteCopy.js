const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();
const siteCopyPath = path.join(__dirname, "..", "data", "site-copy.json");

router.get("/site-copy", (_req, res) => {
  try {
    const raw = fs.readFileSync(siteCopyPath, "utf8");
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object" || !data.en || !data.lt) {
      return res.status(404).json({ error: "Site copy file missing or invalid." });
    }
    res.json(data);
  } catch {
    res.status(404).json({ error: "Site copy not configured yet." });
  }
});

module.exports = router;
