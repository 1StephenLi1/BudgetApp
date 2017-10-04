var express = require('express');
var router = express.Router();
var models = require('../models');
var session = require('express-session');
var auth = require('../auth.js');

var user;
/* GET settings page. */
router.get('/', function(req, res, next) {
    res.render('settings', {
        title: 'Profile Settings',
        user: req.session.user
    })
});

/* POST settings */
router.post('/', function(req, res) {
    console.log("ff received");
    var salt = auth.genSalt(128);
    models.User.update({
        email: req.body.email,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        salt : salt,
        password : auth.sha512(req.body.password, salt)
        },
        {
        where: {
            "id": req.session.user.id,
        }
    }).catch(function (err) {
        console.error(err);
        res.status(err.status || 500);
        res.render('error', {
            user: req.session.user
        });
    });
})


module.exports = router;
