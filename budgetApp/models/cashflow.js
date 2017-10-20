"use strict";

module.exports = function(sequelize, DataTypes) {
    var Cashflow = sequelize.define("Cashflow", {
        dateTime: {
            type: DataTypes.DATE,
            allowNull: false
        },
        amount: {
            type: DataTypes.DECIMAL(65,2),
            defaultValue: 0,
            allowNull: false
        },
        shortDescription: DataTypes.STRING,
        longDescription: DataTypes.STRING,
        isExpense: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        }
    });

    Cashflow.associate = function(models) {
        Cashflow.belongsTo(models.Category, {
            foreignKey: {
                allowNull: false
            }
        })
        Cashflow.belongsTo(models.Recurring)
        Cashflow.belongsTo(models.User, {
            foreignKey: {
                allowNull: false
            }
        })
    }

    return Cashflow;
};
