"use strict";

module.exports = function(sequelize, DataTypes) {
  var User = sequelize.define("User", {
    username: {
      type: DataTypes.STRING,
      unique: true
    },
    email: {
      type: DataTypes.STRING,
      unique: true
    },
    password: DataTypes.STRING,
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    profilePic: DataTypes.STRING, // Link to picture
    contactNumber: DataTypes.INTEGER,
    isDeleted:  {
      type: DataTypes.BOOLEAN,
      defaultValue: 0,
      allowNull: false
    }
  });

  User.associate = function(models) {
      User.hasMany(models.Budget),
      User.belongsTo(models.Company)
  }
  
  return User;
};
