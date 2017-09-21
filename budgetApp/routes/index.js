var express = require('express');
var router = express.Router();
var models = require('../models');
var session = require('express-session');
var user;
/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('index', { title: 'Show sonthing here...' });
  models.User.findOne({where: {email: req.session.email}}).then(function(user) {
  	// console.log("-----------------------------------------");
  	// console.log(req.session.id);		//req.session.id is not the same id in our database
  	// console.log("------------------------------------------");
  	models.Category.findOne({where: {UserId: user.id, name: 'expense'}}).then(function(cat) {
	    models.Cashflow.findOne({where: {CategoryId: cat.id}}).then(function(cash) {
	    	res.render('index', {title: 'My Expense', cash: cash, user: user})
    	})
  	})
  })
});


module.exports = router;
