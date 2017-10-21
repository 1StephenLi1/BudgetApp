"use strict";

module.exports = function(sequelize, DataTypes) {
    var Portfolio = sequelize.define("Portfolio", {
        boughtPrice: {
            type: DataTypes.DECIMAL(65,2),
            defaultValue: 0,
            allowNull: false
        },
        sharePriceOpen: {
            type: DataTypes.DECIMAL(65,2),
            defaultValue: 0,
            allowNull: false
        },
        sharePriceClose: {
            type: DataTypes.DECIMAL(65,2),
            defaultValue: 0,
            allowNull: false
        },
        shareAmount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false
        },
        firstTrade: {
            type: DataTypes.DATE,
            allowNull: false
        },
        symbol: {
            type: DataTypes.STRING
        }

    });

    Portfolio.associate = function(models) {
        Portfolio.belongsTo(models.User, {
            foreignKey: {
                allowNull: false
            }
        })
        Portfolio.belongsTo(models.Recurring)
    }

    return Portfolio;
};