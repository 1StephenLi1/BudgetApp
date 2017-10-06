var express = require('express');
var router = express.Router();
var models = require('../models');
var session = require('express-session');
var user;

/* GET home page. */
router.get('/categories', function(req, res, next) {
	models.Cashflow.findAll({
		where: {
			"UserId": req.session.user.id
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

module.exports = router;