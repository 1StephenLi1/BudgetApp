var express = require('express');
var router = express.Router();
var models = require('../models');
var session = require('express-session');
var user;
/* GET home page. */
router.get('/', function(req, res, next) {
	
	res.render('index', {
        title: 'Dashboard',
        user: req.session.user
    })
});


module.exports = router;
