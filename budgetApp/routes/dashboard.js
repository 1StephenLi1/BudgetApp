var express = require('express');
var router = express.Router();
var models = require('../models');
var session = require('express-session');
var moment = require('moment');
var user;

router.get('/categories', function(req, res, next) {
	models.Cashflow.findAll({
		where: {
			"UserId": req.session.user.id,
			"dateTime": { gt: req.query.date },
			"isExpense": 1
		},
		attributes: [
			[models.sequelize.fn('sum', models.sequelize.col('amount')), 'total']
		],
		include: models.Category,
		group: ['CategoryId']
	}).then(function(categories) {
		var totals = [];
		var names = [];
		for (var i = 0; i < categories.length; i++) {
			totals.push(categories[i].dataValues.total);
			names.push(categories[i].dataValues.Category.name);
		}
		res.end(JSON.stringify({totals: totals, names: names}));
	}).catch(function (err) {
        console.error(err);
        res.status(err.status || 500);
        res.render('error', {
            user: req.session.user
        });
    });
})

router.get('/time', function(req, res, next) {
	models.Cashflow.findAll({
		attributes: ['dateTime', 'amount'],
		where: {
			"UserId": req.session.user.id,
			"dateTime": { gt: req.query.date },
			"isExpense": 1
		},
		order: [['dateTime', 'ASC']]
	}).then(function(outflows) {
		var totals = [];
		var dates = [];

		// Default is weekly
		var interval = "weeks";
		var intervalQ = 1;
		var dateFormat = "MMM Do";
		if (req.query.filter == "quarter") {
			// Fortnightly
			intervalQ = 2;
			dateFormat = "MMM Do";
		} else if (req.query.filter == "year") {
			// Monthly
			interval = "months";
			dateFormat = "MMM";
		}

		// Exclusive of start date
		var currPeriod = moment(req.query.date).add(1, 'days');

		var i = 0;
		while (currPeriod.isBefore(moment()) && i < outflows.length) {
			dates.push(currPeriod.format(dateFormat));
			currPeriod = currPeriod.add(intervalQ, interval);
			var currTotal = 0;
			while (currPeriod.isAfter(moment(outflows[i].dataValues.dateTime))) {
				currTotal += parseInt(outflows[i++].dataValues.amount);
				if (i == outflows.length) break;
			}
			
			totals.push(currTotal);
		}
		
		res.end(JSON.stringify({totals: totals, dates: dates}));
	}).catch(function (err) {
        console.error(err);
        res.status(err.status || 500);
        res.render('error', {
            user: req.session.user
        });
    });
})

module.exports = router;