var express = require('express');
var router = express.Router();
var models  = require('../models');
var auth = require('../auth.js');

/* GET login page */
router.get('/:token', function(req, res, next) {
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

router.post('/:token', function(req, res) {
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

		   req.flash('resetSuccess', 'Your password has been reset!')
		} else {
		   req.flash('unmatchedPasswords', 'Passwords do not match!');	
		}
		res.redirect('http://' + req.headers.host + '/resetPassword/' + req.params.token);			  		 
	})
	
})	
module.exports = router;
