var express = require('express');
var router = express.Router();
var models = require('../models');
var moment = require('moment-timezone');
var csv = require('fast-csv');
var fs = require('fs');
var mv = require('mv');

router.get('/', function(req, res, next) {
    models.Category.findAll({
        where: {
            type: "expense",
            UserId: req.session.user.id
        }
    }).then(function(categories) {
        models.Goal.findAll({
            where: {
                UserId: req.session.user.id
            }
        }).then(function(goals) {
            res.render('addGoal', {
                title: 'Add Goal',
                user: req.session.user,
                categories: categories,
                goals: goals
            })
        })
    })

    

    categoryUrlQuery = req.query['category'];
});

router.post('/addGoal', function(req, res) {
    var query = {
        UserId: req.session.user.id
    };

    req.body.category = parseInt(req.body.category);

    if (req.body.category > 0) {
        query['CategoryId'] = req.body.category;
    } else if (req.body.category == 0) {
        query['name'] = "Total Spending";
    } else if (req.body.category == -1) {
        query['name'] = "Savings Goal";
    } else {
        res.status(400).json({
            errorMsg: "An error occured, try again later"
        })
    }

	models.Goal.findOrCreate({
        where: query
    }).then(function([goal, isNewlyCreated]) {
        var isUpdated = false;
        if (parseFloat(goal.dataValues['amount']) != parseFloat(req.body.amount)) {
            goal.update({ amount: req.body.amount });
            isUpdated = true;
        }

        var message;
        if (isUpdated && !isNewlyCreated) {
            message = "Goal updated successfully";
        } else {
            message = "Goal added successfully";
        }

        if (goal == null) {
            res.status(400).json({
                status: 400,
                message: "An error occured, try again later"
            })
        } else {
            res.status(200).json({
                status: 200,
                message: message
            })
        }
    }).catch(function (err) {
        console.error(err);
        res.status(err.status || 500);
        res.render('error', {
            user: req.session.user
        });
    });
})

module.exports = router;