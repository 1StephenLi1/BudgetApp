"use strict";

module.exports = function(sequelize, DataTypes) {
    var Goal = sequelize.define("Goal", {
        amount: {
            type: DataTypes.DECIMAL(65,2),
            defaultValue: 0,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING,
            allowNull: true
        }
    });

    Goal.associate = function(models) {
        Goal.belongsTo(models.User),
        Goal.belongsTo(models.Category)
    }

    return Goal;
};
