"use strict";

module.exports = function(sequelize, DataTypes) {
    var Goal = sequelize.define("Goal", {
        amount: {
            type: DataTypes.DECIMAL(65,2),
            defaultValue: 0,
            allowNull: false
        },
        goalType: {
            type: DataTypes.STRING,
            allowNull: false
        },
        startDate: {
            type: DataTypes.DATE,
            allowNull: false
        },
        endDate: {
            type: DataTypes.DATE,
            allowNull: false
        }
    });

    Goal.associate = function(models) {
        Goal.belongsTo(models.User)
    }

    return Goal;
};
