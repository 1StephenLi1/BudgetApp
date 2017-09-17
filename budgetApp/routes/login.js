var express = require('express');
var router = express.Router();
var models  = require('../models');
var auth = require('../auth.js');

/* GET login page */
router.get('/', function(req, res, next) {
	if (req.session.authenticated) {
		res.redirect('/');
	} else {
		res.render('login', { title: 'Login', login: req.flash('login'), signup: req.flash('signup') });
	}
});

/* POST login attempt */
router.post('/', function(req, res, next) {
	var creds = {
		"email": req.body.email,
		"password": req.body.password,
	}

	models.User.findOne({
		where: {
			"email": creds.email
		}
	}).then(user => {
		if (user == null) {
			req.flash('login', 'Account ' + creds.email + ' not found');
			res.redirect('/login');
		} else {
			var salt = user.dataValues.salt;
			if (auth.sha512(creds.password, salt) == user.dataValues.password) {
				req.session.authenticated = true;
				req.session.email = user.dataValues.email;
				req.session.firstName = user.dataValues.firstName;
				req.session.lastName = user.dataValues.lastName;
				res.redirect('/');
			} else {
				req.flash('login', 'Incorrect password for ' + user.email);
				res.redirect('/login');
			}
		}
	})
	// res.render('login', { title: 'Login', message: req.flash('message') });
});

module.exports = router;