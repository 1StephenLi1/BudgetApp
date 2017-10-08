var express = require('express');
var router = express.Router();
var models  = require('../models');
var auth = require('../auth.js');
var nodemailer = require('nodemailer');

/* GET login page */
router.get('/', function(req, res, next) {
	if (req.session.authenticated) {
		res.redirect('/');
	} else {
		res.render('forgotPassword', { title: 'Forgot Password', forgot: req.flash('forgot'), reset: req.flash('reset')});
	}
});

router.post('/', function(req, res) {
	
	models.User.findOne({
		where: {
			"email": req.body.email
		}
	}).then(user => {
		if (user == null) {
			req.flash('forgot', 'No accout with email ' + req.body.email + ' exists');
		} else {
			req.flash('reset', 'A password reset e-mail has been sent to ' + req.body.email);			
			console.log(req.body.email);	
		}

		
		res.redirect('/forgotPassword');
	})
})	

module.exports = router;
