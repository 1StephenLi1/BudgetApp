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
						res.redirect('/login/twoFactorAuth/' + token);						
							}
			} else {
				req.flash('login', 'Incorrect password');
				res.redirect('/login');
			}
		}
	})
	// res.render('login', { title: 'Login', message: req.flash('message') });
});

/* GET 2FA page */
router.get('/twoFactorAuth/:token', function(req, res, next) {
	models.User.findOne({
		where: {
			"twoFactorAuthToken": req.params.token,
			"twoFactorExpires" :  { $gt: Date.now() }
		}
	}).then(user => {
		if (user == null) {
			res.redirect('/login');
		} else {
			res.render('twoFactorAuth',
				{ 
                    title: 'Login Code',
                    incorrectCode: req.flash('incorrectCode')
				});
		}
	});
});

/* POST 2FA attempt */
router.post('/twoFactorAuth/:token', function(req, res) {
	models.User.findOne({
		where: {
			"twoFactorAuthToken" : req.params.token
		}
	}).then(user => {
		if (req.body.twoFaCode == user.twoFactorAuthCode) {

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
           req.flash('incorrectCode', 'Your code is incorrect or has expired.');	
           res.redirect('/login/twoFactorAuth/' + req.params.token)
		}		  		 
	})
});	

/* GET forgot password page */
router.get('/forgotPassword', function(req, res, next) {
	if (req.session.authenticated) {
		res.redirect('/');
	} else {
		res.render('forgotPassword', 
			{ 
				title: 'Forgot Password',
				forgot: req.flash('forgot'),
				reset: req.flash('reset'),
				invalidToken : req.flash('invalidToken')
			});
	}
});

/* POST forgot password */
router.post('/forgotPassword', function(req, res) {
	
	models.User.findOne({
		where: {
			"email": req.body.email
		}
	}).then(user => {
		if (user == null) {
			req.flash('forgot', 'No account with email ' + req.body.email + ' exists');
		} else {
			var token = randtoken.generate(20);

			user.update({
				resetPasswordToken : token,
				resetPasswordExpires : Date.now() + 360000,
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
				subject: 'Budget App - Password Reset', 
				html: '<b>Click or paste the following link into your browser to reset your password: <br> http://' + req.headers.host + '/login/resetPassword/' + token + '</b>' 
			};
		
			smtpTransport.sendMail(mailOptions, (error, info) => {
				if (error) {
					return console.log(error);
				}
				console.log('Message sent: %s', info.messageId);

			});
			req.flash('reset', 'A password reset e-mail has been sent to ' + req.body.email);			
		}
		
		res.redirect('/login/forgotPassword');
	})
});	

/* GET reset password page */
router.get('/resetPassword/:token', function(req, res, next) {
	models.User.findOne({
		where: {
			"resetPasswordToken": req.params.token,
			"resetPasswordExpires" :  { $gt: Date.now() }
		}
	}).then(user => {
		if (user == null) {
			req.flash('invalidToken', 'Password reset link is invalid or expired. Please try again.');		
			res.redirect('/forgotPassword');
		} else {
			res.render('resetPassword',
				{ 
					title: 'Reset Password', 
					resetSuccess: req.flash('resetSuccess'), 
					unmatchedPasswords: req.flash('unmatchedPasswords')
				});
		}
	});
});

/* POST reset password */
router.post('/resetPassword/:token', function(req, res) {
	models.User.findOne({
		where: {
			"resetPasswordToken" : req.params.token
		}
	}).then(user => {
		if (req.body.newPassword == req.body.confirmPassword) {
			var salt = auth.genSalt(128);			

			user.update({
				salt : salt,        
				password : auth.sha512(req.body.newPassword, salt)
				});

			req.flash('resetSuccess', 'Your password has been reset! Please try logging in again.');
		} else {
		   req.flash('unmatchedPasswords', 'Passwords do not match!');	
		}
		res.redirect('/login/resetPassword/' + req.params.token);			  		 
	})
	
})	
module.exports = router;
