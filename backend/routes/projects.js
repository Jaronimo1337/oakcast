const express = require("express");
const { Project } = require("../models");

const router = express.Router();

router.get("/", async (_req, res) => {
  try {
    const projects = await Project.findAll({ order: [["created_at", "DESC"]] });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch projects." });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) {
      return res.status(404).json({ error: "Project not found." });
    }
    return res.json(project);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch project." });
  }
});

module.exports = router;
