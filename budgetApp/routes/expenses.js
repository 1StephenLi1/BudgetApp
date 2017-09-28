var express = require('express');
var router = express.Router();
var models = require('../models');
var moment = require('moment-timezone');
var csv = require('fast-csv');
var fs = require('fs');

var shortDescription;
var longDescription;
var amount;
var dateTime;
/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('index', { title: 'Show sonthing here...' });
  models.User.findOne({where: {email: req.session.user.email}}).then(function(user) {
  	// console.log("-----------------------------------------");
  	// console.log(req.session.id);		//req.session.id is not the same id in our database
  	// console.log("------------------------------------------");
  	models.Category.findOne({where: {UserId: user.id, name: 'expense'}}).then(function(cat) {
	    models.Cashflow.findOne({where: {CategoryId: cat.id}}).then(function(cash) {
	    	res.render('expenses', {title: 'My Expense', cash: cash, user: user})
    	})
  	})
  })
});

router.get('/addExpense', function(req, res) {

    res.render('addExpense', {
        title: 'Add Expense',
        user: req.session.user
    })
})


router.post('/addExpense', function(req, res) {
    models.Category.findOrCreate({
        where: {
            "UserId": req.session.user.id,
            "type": "expense",
            "name": req.body.category
        },
        default: {
            "isArchived": 0
        }
    }).then(function([category, isNewlyCreated]) {
        models.Cashflow.create({
            dateTime: moment(req.body.expenseDate,'DD/MM/YYYY').tz("Australia/Sydney"),
            amount: req.body.amount,
            shortDescription: req.body.shortDescription,
            longDescription: req.body.longDescription,
            isExpense: true,
            CategoryId: category.dataValues.id,
            UserId: req.session.user.id
        }).then(function(expense) {
            if (expense == null) {
                res.status(400).json({
                    errorMsg: "An error occured, try again later"
                })
            } else {
                res.status(200).json({
                    msg: "Expense added successfully"
                })
            }
        })
    }).catch(function (err) {
        console.error(err);
        res.status(err.status || 500);
        res.render('error', {
            user: req.session.user
        });
    });
})


router.get('/uploadCsv', function(req, res) {
    res.render('uploadCsv', {
        title: 'Upload CSV',
        user: req.session.user
    })
})

router.post('/uploadCsv', function(req, res) {
   if (!req.files)
    return res.status(400).send('No files were uploaded.');

  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  let csvFile = req.files.mycsv;
  let fliePath = __dirname+'';
  let newFilePath = '';
  let arr = fliePath.split('\\');

  for (let i = 0; i < arr.length -1; i++) {
    newFilePath += arr[i]+'/';
  }
  // Use the mv() method to place the file somewhere on your server
  csvFile.mv(newFilePath + '/csv/' + csvFile.name, function(err) {
    if (err) {
        return res.status(500).render('uploadCsv', { title: err });
    } else {
        res.send('File uploaded!');
        var stream = fs.createReadStream(newFilePath + '/csv/' + csvFile.name);

        csv
        .fromStream(stream, {headers : true})
        .on("data", function(data){
            amount = data['Amount'],
            shortDescription = data['Short Description'],
            longDescription = data['Long Description'],
            dateTime = data['DateTime'],
            models.Cashflow.create({
                shortDescription: shortDescription,
                longDescription: longDescription,
                amount: amount,
                //dateTime: dateTime,
                //UserId: req.session.user.id
            }).then(function(expense) {
                if (expense == null) {
                    res.status(400).json({
                        errorMsg: "An error occured, try again later"
                    })
                } else {
                    res.status(200).json({
                        msg: "Expense was created"
                    })
                }
            })
        }).on("end", function(){
        console.log("done");
    });
    }

  });

});



module.exports = router;
