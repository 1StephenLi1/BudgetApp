var express = require('express');
var router = express.Router();
var models = require('../models');
var session = require('express-session');
var auth = require('../auth.js');
var fs = require('fs');
var path = require('path');

var user;

/* GET settings page. */
router.get('/', function(req, res, next) {
    res.render('settings', {
        title: 'Profile Settings',
        user: req.session.user,
    })
});

/* POST settings */
router.post('/', function(req, res) {

    var salt = auth.genSalt(128);
    var email;
    var firstName;
    var lastName;
    //if fields are empty, use existing details
    if (Object.keys(req.body.email).length === 0) {
        email = req.session.user.email;
    } else {
        email = req.body.email;
    }
    if (Object.keys(req.body.firstName).length === 0) {
        firstName = req.session.user.firstName;
    } else { 
        firstName = req.body.firstName;
    }
    if (Object.keys(req.body.lastName).length === 0) {
        lastName = req.session.user.lastName;
    } else {
        lastName = req.body.lastName;
    }

    models.User.update({
        email: email,
        firstName: firstName,
        lastName: lastName,
        },
        {
        where: {
            "id": req.session.user.id,
        }
    }).catch(function (err) {
    console.log("oh no");
    });

    if (Object.keys(req.body.password).length !== 0) {
    models.User.update({
        salt : salt,        
        password : auth.sha512(req.body.password, salt)
        },
        {
        where: {
            "id": req.session.user.id,
        }
    }).catch(function (err) {
    console.log("oh no");
    });
    }
    res.redirect('/');          
})

router.post('/uploadPhoto', function(req, res) {
    console.log(req.files.profilePic);
    let profilePic = req.files.profilePic;
    var profilePicName = 'profilePic-'+req.session.user.id+'.png';
    var profilePicDir = 'public/images/'+profilePicName;

    profilePic.mv(profilePicDir, function(err) {
        if (err)
          return res.status(500).send(err);
     
            models.User.update({
                profilePic : profilePicName
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
        res.redirect('/');      
      });
})

router.post('/deleteAccConfirm', function(req, res) {
    var profilePicName = 'profilePic-'+req.session.user.id+'.png';
    var profilePicDir = 'public/images/'+profilePicName;
        models.User.update({
            isDeleted : "1"
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
        if (fs.existsSync(profilePicDir)) {            
            fs.unlinkSync(profilePicDir);        
        }
        req.session.authenticated = false;
        res.redirect('/login');              
    })

module.exports = router;
