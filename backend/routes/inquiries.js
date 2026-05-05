const express = require("express");
const { Inquiry } = require("../models");
const { sendInquiryEmail } = require("../lib/mailer");

const router = express.Router();

router.get("/", async (_req, res) => {
  try {
    const inquiries = await Inquiry.findAll({ order: [["created_at", "DESC"]] });
    res.json(inquiries);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch inquiries." });
  }
});

router.post("/", async (req, res) => {
  try {
    const inquiry = await Inquiry.create(req.body);
    try {
      const sent = await sendInquiryEmail(inquiry);
      if (!sent && process.env.NODE_ENV !== "test") {
        console.warn("SMTP is not configured. Inquiry email was not sent.");
      }
    } catch (mailError) {
      console.error("Failed to send inquiry email:", mailError.message);
    }
    res.status(201).json(inquiry);
  } catch (error) {
    res.status(400).json({ error: "Invalid inquiry payload.", details: error.message });
  }
});

module.exports = router;
