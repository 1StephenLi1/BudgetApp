var express = require('express');
var router = express.Router();
var models = require('../models');
var moment = require('moment-timezone');
var csv = require('fast-csv');
var fs = require('fs');
var mv = require('mv');


router.get('/', function(req, res, next) {
  //res.render('index', { title: 'Show sonthing here...' });
  models.User.findOne({where: {email: req.session.user.email}}).then(function(user) {
  	// console.log("-----------------------------------------");
  	// console.log(req.session.id);		//req.session.id is not the same id in our database
  	// console.log("------------------------------------------");
  	models.Category.findOne({where: {UserId: user.id, name: 'expense'}}).then(function(cat) {
	    models.Cashflow.findOne({where: {CategoryId: cat.id}}).then(function(cash) {
	    	res.render('expenses', {title: 'My Expense', cash: cash, user: user})
    	})
  	})
  })
});

router.get('/addGoal', function(req, res, next) {
	res.render('addGoal', {
        title: 'Set Goal',
        user: req.session.user
    })
});

router.post('/addGoal', function(req, res) {
	models.Category.findOrCreate({
        where: {
            "UserId": req.session.user.id,
            "type": "goal",
            "name": req.body.category
        },
        default: {
            "isArchived": 0
        }
    }).then(function([category, isNewlyCreated]) {
        models.Goal.create({
            startDate: moment(req.body.startDate,'DD/MM/YYYY').tz("Australia/Sydney"),
            endDate: moment(req.body.endDate,'DD/MM/YYYY').tz("Australia/Sydney"),
            amount: req.body.amount,
            goalType: req.body.goalType,
            GoalId: goal.dataValues.id,
            UserId: req.session.user.id
        }).then(function(goal) {
            if (goal == null) {
                res.status(400).json({
                    errorMsg: "An error occured, try again later"
                })
            } else {
                res.status(200).json({
                    msg: "Goal added successfully"
                })
            }
        })
    }).catch(function (err) {
        console.error(err);
        res.status(err.status || 500);
        res.render('error', {
            user: req.session.user
        });
    });
})


module.exports = router;
