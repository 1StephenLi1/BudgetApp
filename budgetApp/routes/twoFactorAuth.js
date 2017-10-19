var express = require('express');
var router = express.Router();
var models  = require('../models');
var auth = require('../auth.js');

/* GET login page */
router.get('/:token', function(req, res, next) {
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

router.post('/:token', function(req, res) {
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
           res.redirect('/twoFactorAuth/' + req.params.token)
		}		  		 
	})
})	
module.exports = router;
