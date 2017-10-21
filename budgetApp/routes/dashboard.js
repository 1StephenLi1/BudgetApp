var express = require('express');
var router = express.Router();
var models = require('../models');
var session = require('express-session');
var moment = require('moment');
var Sequelize = require('sequelize');
const Op = Sequelize.Op;

router.get('/categories', function(req, res, next) {
	if (req.query.date == null) {
		req.query.date = '1970-01-01';
	}
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
		res.end(JSON.stringify({totals: totals, names: names}, null, '\t'));
	}).catch(function (err) {
        console.error(err);
        res.status(err.status || 500);
        res.render('error', {
            user: req.session.user
        });
    });
})

router.get('/time', function(req, res, next) {
	if (req.query.date == null) {
		req.query.date = '1970-01-01';
	}
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
		
		res.end(JSON.stringify({totals: totals, dates: dates}, null, '\t'));
	}).catch(function (err) {
        console.error(err);
        res.status(err.status || 500);
        res.render('error', {
            user: req.session.user
        });
    });
})

router.get('/social', function(req, res, next) {
	if (req.query.date == null) {
		req.query.date = '1970-01-01';
	}

	models.Cashflow.sequelize.query("SELECT Categories.name, Categories.id, sum(Cashflows.amount) as total, Cashflows.UserId FROM Cashflows INNER JOIN Categories on Cashflows.CategoryId = Categories.id WHERE Cashflows.dateTime > $1 AND Cashflows.isExpense = 1 AND Categories.name in (SELECT name from Categories WHERE UserId = $2 AND type = 'expense') GROUP BY Categories.name, Categories.id, Cashflows.UserId;", { bind: [req.query.date, req.session.user.id] }).then(function(result) {
		models.Goal.findAll({
			where: {
				"UserId": req.session.user.id
			},
			order: [['CategoryId', 'ASC']]
		}).then(function(goals_db) {
			goals = {};
			for (var i = 0; i < goals_db.length; i++) {
				goals[goals_db[i].dataValues['CategoryId']] = goals_db[i].amount;
			}
			var data = [];
			var i = 0;
			while (i < result[0].length) {
				var categoryName = result[0][i]['name'];
				var me = null; // how much I've spent
				var everyone = 0; // total for everyone
				var people_lt_me = 0; // users spending less than me
				var users = 0; // total users
				var goal = null;
				var goal_percentage = 0;
				// find my total, used to make comparisons with others
				for (var j = i; j < result[0].length; j++) {
					if (result[0][j]['UserId'] == req.session.user.id) {
						me = parseFloat(result[0][j]['total']);
						break;
					}
				}
				while (i < result[0].length) {
					var curr = result[0][i];
					if (curr['name'] != categoryName) {
						break;
					}
					everyone += parseFloat(curr['total']);
					if (curr['total'] < me) {
						people_lt_me += 1;
					}
					if (goals[curr['id']]) {
						goal = goals[curr['id']];
						if (req.query.filter == "quarter") {
							goal *= 4;
						} else if (req.query.filter == "year") {
							goal *= 12;
						}
						goal_percentage = me*100/goal;
					}
					users += 1;
					i += 1;
				}
				data.push({ key: categoryName, value: {
					me: me,
					average: everyone/users,
					more_than: people_lt_me,
					users: users,
					goal: goal,
					goal_percentage: goal_percentage
				}})
			}
			res.end(JSON.stringify(data, null, '\t'));
		})
	}).catch(function (err) {
        console.error(err);
        res.status(err.status || 500);
        res.render('error', {
            user: req.session.user
        });
    });
})

router.get('/goals', function(req, res, next) {
	if (req.query.date == null) {
		req.query.date = '1970-01-01';
	}

	models.Cashflow.findAll({
		where: {
			"UserId": req.session.user.id,
			"dateTime": { gt: req.query.date }
		},
		attributes: [
			[models.sequelize.fn('sum', models.sequelize.col('amount')), 'total'], 'isExpense'
		],
		group: ['isExpense'],
		order: [['isExpense', 'ASC']]
	}).then(function(cashflows) {
		var actual_income = null;
		var actual_spending = null;
		for (var i = 0; i < cashflows.length; i++) {
			if (cashflows[i]['dataValues']['isExpense']) {
				actual_spending = cashflows[i]['dataValues']['total'];
			} else {
				actual_income = cashflows[i]['dataValues']['total'];
			}
		}

		models.Goal.findAll({
			where: {
				"UserId": req.session.user.id,
				$or: {
					"name": ["Total Spending", "Savings Goal"]
				}
			}
		}).then(function(goals_db) {
			var saving_goal = null;
			var spending_goal = null;
			for (var i = 0; i < goals_db.length; i++) {
				if (goals_db[i]['dataValues']['name'] == "Total Spending") {
					spending_goal = goals_db[i]['dataValues']['amount'];
				} else if (goals_db[i]['dataValues']['name'] == "Savings Goal") {
					saving_goal = goals_db[i]['dataValues']['amount'];
				}
			}

			var data;
			if (actual_income == null && actual_spending == null & spending_goal == null && saving_goal == null) {
				data = { data: [], labels: [] };
			} else {
				data = { data: [actual_income, actual_spending, spending_goal, saving_goal], labels: ["Your income", "Your spending", "Budgeted spending", "Savings goal"] };
			}
			res.end(JSON.stringify(data, null, '\t'));
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