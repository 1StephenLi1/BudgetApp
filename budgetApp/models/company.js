"use strict";

module.exports = function(sequelize, DataTypes) {
  var Company = sequelize.define("Company", {
    name: DataTypes.STRING,
  });

  Company.associate = function(models) {
      Company.hasMany(models.User)
  }

  return Company;
};
