var express = require('express');
var router = express.Router();
var models  = require('../models');
var auth = require('../auth.js');
var nodemailer = require('nodemailer');
var randtoken = require('rand-token');

/* GET login page */
router.get('/', function(req, res, next) {
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

router.post('/', function(req, res) {
	
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
				html: '<b>Click or paste the following link into your browser to reset your password: <br> http://' + req.headers.host + '/resetPassword/' + token + '</b>' 
			};
		
			smtpTransport.sendMail(mailOptions, (error, info) => {
				if (error) {
					return console.log(error);
				}
				console.log('Message sent: %s', info.messageId);

			});
			req.flash('reset', 'A password reset e-mail has been sent to ' + req.body.email);			
		}
		
		res.redirect('/forgotPassword');
	})
})	

module.exports = router;
