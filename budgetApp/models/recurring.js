"use strict";

module.exports = function(sequelize, DataTypes) {
    var Recurring = sequelize.define("Recurring", {
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
        },
        startDate: DataTypes.DATE,
        endDate: DataTypes.DATE,
        frequency: DataTypes.STRING,
        interval: DataTypes.INTEGER,
        repeatsOn: DataTypes.STRING,
        laterSchedule: DataTypes.STRING,
        isArchived:  {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          allowNull: false
        }
    });

    Recurring.associate = function(models) {
        Recurring.belongsTo(models.Category, {
            foreignKey: {
                allowNull: false
            }
        })
        Recurring.belongsTo(models.User, {
            foreignKey: {
                allowNull: false
            }
        })
    }

    return Recurring;
};
