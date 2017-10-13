var express = require('express');
var router = express.Router();
var models = require('../models');

/* Returns JSON of categories based on query */
router.get('/categories', function(req, res, next) {
	var autocompletes = [];
	models.Category.findAll({
		where: {
			"UserId": req.session.user.id,
			"type": req.query.type,
			"name": {
				$like: req.query.key + '%'
			}
		},
		limit: 10
	}).then(categories => {
		for (var i = 0; i < categories.length; i++) {
			var category = categories[i];
			autocompletes.push(category.dataValues.name);
		}
		res.end(JSON.stringify(autocompletes));
	}).catch(function (err) {
		console.error(err);
		res.status(err.status || 500);
		res.render('error', {
			user: req.session.user
		});
	});
});

/* Returns JSON of short descriptions based on query */
router.get('/shortDescs', function(req, res, next) {
	var autocompletes = [];
	var isExpense = true;
	if (req.query.type != undefined) {
		if (req.query.type == "income") {
			isExpense = false;
		}
	}
	models.Cashflow.findAll({
		where: {
			"UserId": req.session.user.id,
			"isExpense": isExpense,
			"shortDescription": {
				$like: req.query.key + '%'
			}
		},
		limit: 10
	}).then(cashFlows => {
		for (var i = 0; i < cashFlows.length; i++) {
			var cashFlow = cashFlows[i];
			autocompletes.push(cashFlow.dataValues.shortDescription);
		}
		res.end(JSON.stringify(autocompletes));
	}).catch(function (err) {
		console.error(err);
		res.status(err.status || 500);
		res.render('error', {
			user: req.session.user
		});
	});
});

module.exports = router;
