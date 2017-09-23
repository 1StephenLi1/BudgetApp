"use strict";

module.exports = function(sequelize, DataTypes) {
    var Category = sequelize.define("Category", {
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
    });

    Category.associate = function(models) {
        Category.belongsTo(models.User)
    }


    return Category;
};
