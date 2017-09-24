var express = require('express');
var router = express.Router();
var models  = require('../models');
var auth = require('../auth.js');

/* GET login page */
router.get('/', function(req, res, next) {
	if (req.session.authenticated) {
		res.redirect('/');
	} else {
		res.render('signup', { title: 'Sign Up', signup: req.flash('signup') });
	}
});

/* POST signup */
router.post('/', function(req, res, next) {
	// console.log("Received " + req.body.email);
	var user = {
		"email": req.body.email,
		"password": req.body.password,
		"firstName": req.body.firstName,
		"lastName": req.body.lastName,
		"salt": auth.genSalt(128)
	}

	user.password = auth.sha512(user.password, user.salt);

	models.User.create(user).then(function(u) {
		res.redirect('/');
	}).catch(function(error) {
		req.flash('signup', 'An account already exists with email ' + user.email);
		res.redirect('/signup');
	});
});

module.exports = router;
