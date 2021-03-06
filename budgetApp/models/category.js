"use strict";

module.exports = function(sequelize, DataTypes) {
    var Category = sequelize.define("Category", {
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        type: {
            type: DataTypes.ENUM,
            values: ['income', 'expense', 'goal', 'budget'],
            allowNull: false,
            default: 'expense'
        },
        isArchived:  {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          allowNull: false
        }
    });

    Category.associate = function(models) {
        Category.belongsTo(models.User)
    }

    return Category;
};
