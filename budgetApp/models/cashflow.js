"use strict";

module.exports = function(sequelize, DataTypes) {
    var Cashflow = sequelize.define("Cashflow", {
        dateTime: DataTypes.DATE,
        amount: {
            type: DataTypes.DECIMAL(65,2),
            defaultValue: 0,
            allowNull: false
        },
        shortDescription: DataTypes.STRING,
        longDescription: DataTypes.STRING,
        isExpense: DataTypes.BOOLEAN,
    });

    Cashflow.associate = function(models) {
        Cashflow.belongsTo(models.Category)
        Cashflow.belongsTo(models.Recurring)
    }

    return Cashflow;
};
