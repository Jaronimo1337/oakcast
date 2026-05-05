const sequelize = require("../config/database");
const createProject = require("./project");
const createInquiry = require("./inquiry");

const Project = createProject(sequelize);
const Inquiry = createInquiry(sequelize);

module.exports = {
  sequelize,
  Project,
  Inquiry
};
