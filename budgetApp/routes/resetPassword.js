var express = require('express');
var router = express.Router();
var models  = require('../models');
var auth = require('../auth.js');

/* GET login page */
router.get('/', function(req, res, next) {
	if (req.session.authenticated) {
		res.redirect('/');
	} else {
		res.render('resetPassword', { title: 'reset password', signup: req.flash('resetPassword') });
	}
});

router.post('/', function(req, res) {
	

})	
module.exports = router;
