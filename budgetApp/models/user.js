"use strict";

module.exports = function(sequelize, DataTypes) {
  var User = sequelize.define("User", {
    email: {
      type: DataTypes.STRING,
      unique: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    salt: {
      type: DataTypes.STRING,
      allowNull: false
    },
    profilePic: DataTypes.STRING, // Link to picture
    contactNumber: DataTypes.INTEGER,
    isDeleted:  {
      type: DataTypes.BOOLEAN,
      defaultValue: 0,
      allowNull: false
    },
    resetPasswordToken : DataTypes.STRING,
    resetPasswordExpires : DataTypes.DATE
  });

  User.associate = function(models) {
      User.hasMany(models.Budget),
      User.belongsTo(models.Company)
  }
  
  return User;
};
