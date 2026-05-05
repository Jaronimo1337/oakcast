require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const { sequelize } = require("./models");
const projectRoutes = require("./routes/projects");
const inquiryRoutes = require("./routes/inquiries");
const siteCopyRoutes = require("./routes/siteCopy");
const adminRoutes = require("./routes/admin");

const app = express();
const PORT = process.env.PORT || 5000;
const DB_RETRY_DELAY_MS = Number(process.env.DB_RETRY_DELAY_MS) || 3000;
const DB_RETRY_LIMIT = Number(process.env.DB_RETRY_LIMIT) || 20;

app.use(cors());
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/projects", projectRoutes);
app.use("/api/inquiries", inquiryRoutes);
app.use("/api", siteCopyRoutes);
app.use("/api/admin", adminRoutes);

const start = async () => {
  let attempts = 0;
  while (attempts < DB_RETRY_LIMIT) {
    try {
      attempts += 1;
      await sequelize.authenticate();
      await sequelize.sync({ alter: true });

      app.listen(PORT, () => {
        console.log(`Backend running on port ${PORT}`);
      });
      return;
    } catch (error) {
      console.error(`DB connection attempt ${attempts}/${DB_RETRY_LIMIT} failed.`);
      if (attempts >= DB_RETRY_LIMIT) {
        console.error("Failed to start server:", error);
        process.exit(1);
      }
      await new Promise((resolve) => setTimeout(resolve, DB_RETRY_DELAY_MS));
    }
  }
};

start();
