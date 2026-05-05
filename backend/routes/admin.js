const express = require("express");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const siteCopyPath = path.join(__dirname, "..", "data", "site-copy.json");
const { Project } = require("../models");
const { requireAdmin, getSecret } = require("../middleware/adminAuth");

const router = express.Router();

const uploadsDir = path.join(__dirname, "..", "uploads", "projects");
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    const safe = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
    cb(null, safe);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 12 * 1024 * 1024, files: 40 },
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(jpeg|png|webp|gif)$/i.test(file.mimetype);
    cb(ok ? null : new Error("Only image files are allowed."), ok);
  }
});

function timingSafeEqualString(a, b) {
  const ba = Buffer.from(String(a), "utf8");
  const bb = Buffer.from(String(b), "utf8");
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

router.post("/login", (req, res) => {
  const secret = getSecret();
  const adminUser = process.env.ADMIN_USERNAME;
  const adminPass = process.env.ADMIN_PASSWORD;

  if (!secret || !adminUser || !adminPass) {
    return res.status(503).json({ error: "Admin credentials not configured in environment." });
  }

  const { username, password } = req.body || {};
  if (!timingSafeEqualString(username || "", adminUser) || !timingSafeEqualString(password || "", adminPass)) {
    return res.status(401).json({ error: "Invalid credentials." });
  }

  const token = jwt.sign({ admin: true }, secret, { expiresIn: "7d" });
  res.json({ token });
});

router.use(requireAdmin);

function validateSiteCopy(body) {
  if (!body || typeof body !== "object") return "Invalid body.";
  for (const lng of ["en", "lt"]) {
    const block = body[lng];
    if (!block || typeof block !== "object") return `Missing or invalid "${lng}" object.`;
    if (!Array.isArray(block.timeline) || block.timeline.length !== 4) {
      return `Each language needs timeline as an array of exactly 4 steps (${lng}).`;
    }
    for (let i = 0; i < 4; i += 1) {
      const step = block.timeline[i];
      if (!step || typeof step.title !== "string" || typeof step.text !== "string") {
        return `Invalid timeline step ${i + 1} for ${lng}.`;
      }
    }
  }
  return null;
}

router.put("/site-copy", (req, res) => {
  const err = validateSiteCopy(req.body);
  if (err) return res.status(400).json({ error: err });
  try {
    fs.mkdirSync(path.dirname(siteCopyPath), { recursive: true });
    fs.writeFileSync(siteCopyPath, JSON.stringify(req.body, null, 2), "utf8");
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Could not save site copy.", details: e.message });
  }
});

router.post("/upload", (req, res) => {
  upload.array("images", 30)(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || "Upload failed." });
    }
    const urls = (req.files || []).map((f) => `/uploads/projects/${f.filename}`);
    res.json({ urls });
  });
});

router.get("/projects", async (_req, res) => {
  try {
    const projects = await Project.findAll({ order: [["created_at", "DESC"]] });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch projects." });
  }
});

const SALE_VALUES = new Set(["for_sale", "sold"]);

function normalizeSaleStatus(value, fallback = "for_sale") {
  const v = typeof value === "string" ? value.trim() : "";
  return SALE_VALUES.has(v) ? v : fallback;
}

function normalizeImages(body) {
  let urls = body.image_urls;
  if (typeof urls === "string") {
    try {
      urls = JSON.parse(urls);
    } catch {
      urls = [];
    }
  }
  if (!Array.isArray(urls)) urls = [];
  urls = urls.filter((u) => typeof u === "string" && u.length > 0);
  const primary = urls[0] || body.image_url || "";
  return { image_urls: urls, image_url: primary };
}

router.post("/projects", async (req, res) => {
  try {
    const { title_en, title_lt, description_en, description_lt, category, sale_status } = req.body;
    const { image_urls, image_url } = normalizeImages(req.body);
    const en = typeof description_en === "string" ? description_en.trim() : "";
    const lt = typeof description_lt === "string" ? description_lt.trim() : "";
    const tEn = typeof title_en === "string" ? title_en.trim() : "";
    const tLt = typeof title_lt === "string" ? title_lt.trim() : "";
    if (!tEn || !tLt || !category) {
      return res.status(400).json({ error: "title_en, title_lt, and category are required." });
    }
    if (!en || !lt) {
      return res.status(400).json({ error: "description_en and description_lt are required." });
    }
    if (!image_url && image_urls.length === 0) {
      return res.status(400).json({ error: "At least one image is required." });
    }
    const project = await Project.create({
      title_en: tEn,
      title_lt: tLt,
      description_en: en,
      description_lt: lt,
      category,
      sale_status: normalizeSaleStatus(sale_status),
      image_urls,
      image_url: image_url || image_urls[0]
    });
    res.status(201).json(project);
  } catch (error) {
    res.status(400).json({ error: "Could not create project.", details: error.message });
  }
});

router.put("/projects/:id", async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ error: "Not found." });

    const updates = {};
    if (req.body.title_en !== undefined) {
      updates.title_en = typeof req.body.title_en === "string" ? req.body.title_en.trim() : "";
    }
    if (req.body.title_lt !== undefined) {
      updates.title_lt = typeof req.body.title_lt === "string" ? req.body.title_lt.trim() : "";
    }
    if (req.body.description_en !== undefined) {
      updates.description_en = typeof req.body.description_en === "string" ? req.body.description_en.trim() : "";
    }
    if (req.body.description_lt !== undefined) {
      updates.description_lt = typeof req.body.description_lt === "string" ? req.body.description_lt.trim() : "";
    }
    if (req.body.category !== undefined) updates.category = req.body.category;
    if (req.body.sale_status !== undefined) {
      updates.sale_status = normalizeSaleStatus(req.body.sale_status, project.sale_status || "for_sale");
    }

    if (req.body.image_urls !== undefined || req.body.image_url !== undefined) {
      const { image_urls, image_url } = normalizeImages(req.body);
      updates.image_urls = image_urls;
      updates.image_url = image_url || image_urls[0] || project.image_url;
    }

    await project.update(updates);
    res.json(project);
  } catch (error) {
    res.status(400).json({ error: "Could not update project.", details: error.message });
  }
});

router.delete("/projects/:id", async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ error: "Not found." });
    await project.destroy();
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: "Could not delete project." });
  }
});

module.exports = router;
