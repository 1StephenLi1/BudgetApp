var express = require('express');
var router = express.Router();
var path = require('path');
var models = require('../models');
var csv = require('fast-csv');


var email;
var category;
var expense;
var userId;
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('uploadCsv', { title: 'Upload your csv here...' });
});

router.post('/', function(req, res, next) {
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
            email = data['Email'],
            category = data['Category'],
            expense = data['Amount'],
            models.User.findOne({
                where: {
                    "email": email
            }
            }).then(user => {
                userId = user.dataValues.id;
                var cat = {
                    "UserId": user.dataValues.id,
                    "name": category,
                }
                models.Category.create(cat).then(function(u) {
                models.Category.findOne({
                where: {
                    "UserId": userId    
                }
            }).then(cat => {
                var cashflow = {
                    "CategoryId": cat.dataValues.id,
                    "amount": expense,
                    "inflow": 0,
                }

                models.Cashflow.create(cashflow).then(function(cash){

                }).catch(function(error){});
            })
                }).catch(function(error) {
                    // req.flash('signup', 'An account already exists with email ' + user.email);
                    // res.redirect('/login');
                });
            })
            

        })
    .on("end", function(){
        console.log("done");
    });
    }
              
  });

}); 


module.exports = router;
