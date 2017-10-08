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
			console.log("password reset token is invalid or has expired");
			res.redirect('/forgotPassword');
		} else {
		res.render('resetPassword', { title: 'reset password', signup: req.flash('resetPassword') });
		}
	});
});

router.post('/', function(req, res) {
	
})	
module.exports = router;
