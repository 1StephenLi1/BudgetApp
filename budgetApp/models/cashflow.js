"use strict";

module.exports = function(sequelize, DataTypes) {
    var Cashflow = sequelize.define("Cashflow", {
        dateTime: DataTypes.DATE,
        amount: {
            type: DataTypes.DECIMAL(65,2),
            defaultValue: 0,
            allowNull: false
        },
        inflow: DataTypes.BOOLEAN,
    });

    Cashflow.associate = function(models) {
        Cashflow.belongsTo(models.Category)
        Cashflow.belongsTo(models.Recurring)
    }

    return Cashflow;
};
