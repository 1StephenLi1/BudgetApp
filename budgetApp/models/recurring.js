"use strict";

module.exports = function(sequelize, DataTypes) {
    var Recurring = sequelize.define("Recurring", {
        amount: {
            type: DataTypes.DECIMAL(65,2),
            defaultValue: 0,
            allowNull: false
        },
        startDate: DataTypes.DATE,
        endDate: DataTypes.DATE,
        frequency: DataTypes.INTEGER,
        isArchived:  {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          allowNull: false
        }
    });

    return Recurring;
};
