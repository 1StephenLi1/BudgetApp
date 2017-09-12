"use strict";

module.exports = function(sequelize, DataTypes) {
    var Budget = sequelize.define("Budget", {
        amount: {
            type: DataTypes.DECIMAL(65,2),
            defaultValue: 0,
            allowNull: false
        },
        startDate: DataTypes.DATE,
        endDate: DataTypes.DATE,
    });

    Budget.associate = function(models) {
        Budget.belongsTo(models.User)
    }

    return Budget;
};
