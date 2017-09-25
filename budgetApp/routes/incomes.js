var express = require('express');
var router = express.Router();
var models = require('../models');
var moment = require('moment-timezone');
var csv = require('fast-csv');
var fs = require('fs');

var shortDescription;
var longDescription;
var amount;
var dateTime;
/* GET home page. */
router.get('/', function(req, res, next) {

});

router.get('/addIncome', function(req, res) {
    res.render('addIncome', {
        title: 'Add Income',
        user: req.session.user
    })
})


router.post('/addIncome', function(req, res) {
    if (req.session.user == null || req.session.user.id == null) {
        req.flash('login', 'You must be logged in to create an expense');
        res.status(403).json({
            errorMsg: "You must be logged in to create an income"
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
            errorMsg: "Income amount must be greater than $0"
        })
    } else {
        models.Cashflow.create({
            shortDescription: req.body.shortDescription,
            longDescription: req.body.longDescription,
            amount: req.body.amount,
            dateTime: moment(req.body.incomeDate,'DD/MM/YYYY').tz("Australia/Sydney"),
            UserId: req.session.user.id,
            isExpense: false
        }).then(function(expense) {
            if (expense == null) {
                res.status(400).json({
                    errorMsg: "An error occured, try again later"
                })
            } else {
                res.status(200).json({
                    msg: "Income was created"
                })
            }
        })
    }
})



module.exports = router;
