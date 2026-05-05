const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Inquiry = sequelize.define(
    "Inquiry",
    {
      customer_name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isEmail: true
        }
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM("New", "Replied"),
        defaultValue: "New"
      }
    },
    {
      tableName: "inquiries",
      underscored: true
    }
  );

  return Inquiry;
};
