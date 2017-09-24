var express = require('express');
var router = express.Router();
var models = require('../models');
var moment = require('moment-timezone');

/* GET home page. */
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

router.get('/addExpense', function(req, res) {
    res.render('addExpense', {
        title: 'Add Expense',
        user: req.session.user
    })
})

router.post('/addExpense', function(req, res) {
    if (req.session.user == null || req.session.user.id == null) {
        req.flash('login', 'You must be logged in to create an expense');
        res.status(403).json({
            errorMsg: "You must be logged in to create an expense"
        })
    } else if (req.body.shortDescription == null || !req.body.shortDescription.trim().length) {
        // error must have short Desc
        res.status(400).json({
            errorMsg: "Short Description can not be empty"
        })
    } else if (req.body.shortDescription.length > 100) {
        res.status(400).json({
            errorMsg: "Short Description can not be greater than 100 characters"
        })
    } else if (req.body.amount == null || req.body.amount <= 0) {
        // error must have amount > 0
        res.status(400).json({
            errorMsg: "Expense amount must be greater than $0"
        })
    } else {
        models.Cashflow.create({
            shortDescription: req.body.shortDescription,
            longDescription: req.body.longDescription,
            amount: req.body.amount,
            dateTime: moment(req.body.expenseDate,'DD/MM/YYYY').tz("Australia/Sydney"),
            UserId: req.session.user.id
        }).then(function(expense) {
            if (expense == null) {
                res.status(400).json({
                    errorMsg: "An error occured, try again later"
                })
            } else {
                res.status(200).json({
                    msg: "Expense was created"
                })
            }
        })
    }
})


module.exports = router;
