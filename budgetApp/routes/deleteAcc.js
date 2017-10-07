var express = require('express');
var router = express.Router();
var models  = require('../models');
var auth = require('../auth.js');

/* GET delete account page */
router.get('/', function(req, res, next) {
    res.render('deleteAcc', {
        title: 'Profile Settings',
        user: req.session.user,
    })
});
module.exports = router;
