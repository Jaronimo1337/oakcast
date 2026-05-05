const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Project = sequelize.define(
    "Project",
    {
      title_en: {
        type: DataTypes.STRING,
        allowNull: true
      },
      title_lt: {
        type: DataTypes.STRING,
        allowNull: true
      },
      description_en: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      description_lt: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      category: {
        type: DataTypes.ENUM("Table", "Small Project"),
        allowNull: false
      },
      image_urls: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
      },
      image_url: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      sale_status: {
        type: DataTypes.ENUM("for_sale", "sold"),
        allowNull: false,
        defaultValue: "for_sale"
      }
    },
    {
      tableName: "projects",
      underscored: true
    }
  );

  return Project;
};
