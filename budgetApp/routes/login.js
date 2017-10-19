var express = require('express');
var router = express.Router();
var models  = require('../models');
var auth = require('../auth.js');
var randtoken = require('rand-token');
var nodemailer = require('nodemailer');



/* GET login page */
router.get('/', function(req, res, next) {
	if (req.session.authenticated) {
		res.redirect('/');
	} else {
		res.render('login', { title: 'Login', login: req.flash('login')});
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

				if (!user.twoFactorAuth) {
					req.session.authenticated = true;
					req.session.user = {
						id: user.dataValues.id,
						email: user.dataValues.email,
						firstName: user.dataValues.firstName,
						lastName: user.dataValues.lastName,
						twoFactorAuth : user.twoFactorAuth
						} 
					res.redirect(req.session.reqPath);
				} else {
					console.log("2fa");
					var token = randtoken.generate(20);
					var code = randtoken.generate(6)
					
								user.update({
									twoFactorAuthCode : code,
									twoFactorAuthToken : token,
									twoFactorExpires : Date.now() + 90000,
								});
					
								var smtpTransport = nodemailer.createTransport({
									service: "gmail",
									host: "smtp.gmail.com",
									auth: {
										user: "budgetApp4920@gmail.com",
										pass: "budgetApp./"
									}
								});
								let mailOptions = {
									from: 'Budget App <budgetApp4920@gmail.com>', 
									to: user.email, 
									subject: 'Login Code', 
									html: 'Your login code is: <br><b>' + code + '</b>' 
								};
							
								smtpTransport.sendMail(mailOptions, (error, info) => {
									if (error) {
										return console.log(error);
									}
									console.log('Message sent: %s', info.messageId);
					
								});
							}
					res.redirect('/twoFactorAuth/' + token);

			} else {
				req.flash('login', 'Incorrect password');
				res.redirect('/login');
			}
		}
	})
	// res.render('login', { title: 'Login', message: req.flash('message') });
});

module.exports = router;
