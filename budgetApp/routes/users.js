var express = require('express');
var router = express.Router();
var models  = require('../models');
var auth = require('../auth.js');
var nodemailer = require('nodemailer');
var randtoken = require('rand-token');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/signout', function(req, res, next) {
  req.session.authenticated = false;
  res.redirect('/login');
});

module.exports = router;
