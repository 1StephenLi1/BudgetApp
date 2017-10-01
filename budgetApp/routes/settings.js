var express = require('express');
var router = express.Router();
var models = require('../models');
var session = require('express-session');
var user;
/* GET settings page. */
router.get('/', function(req, res, next) {
    res.render('settings', {
        title: 'Profile Settings',
        user: req.session.user
    })
});



module.exports = router;
