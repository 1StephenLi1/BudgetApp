var express = require('express');
var router = express.Router();
var models = require('../models');
var moment = require('moment-timezone');
var csv = require('fast-csv');
var fs = require('fs');
var mv = require('mv');
var http = require('http');
var json2csv = require('json2csv');



/* GET home page. */

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
  let filePath = __dirname+'';
  let newFilePath = '';
  let arr = filePath.split('/');
  console.log("filePath: " + filePath);
  console.log("array after split: " + arr);
  for (let i = 0; i < arr.length -1; i++) {
    newFilePath += arr[i]+'/';
  }

  console.log("newFilePath: " + newFilePath);
  // Use the mv() method to place the file somewhere on your server
  csvFile.mv(newFilePath + '/bin/' + csvFile.name, function(err) {
    var amount = 0;
    var shortDescription = null;
    var longDescription = null;
    var date = null;
    var category = null;
    if (err) {
        return res.status(500).render('uploadCsv', { title: err, user: req.session.user.id});
    } else {
        var stream = fs.createReadStream(newFilePath + '/bin/' + csvFile.name);
        res.render('addExpense', {
        title: 'Add Expense',
        user: req.session.user
    })
        csv
        .fromStream(stream, {headers: true})
        .transform(function(data, next){
            amount = data['Amount'],
            shortDescription = data['Short Description'],
            longDescription = data['Long Description'],
            date = data['Expense Date'],
            category = data['Category'],
            models.Category.findOrCreate({
            where: {
                "UserId": req.session.user.id,
                "type": "expense",
                "name": category
            },
            default: {
                "isArchived": 0
            }
            }).then(function([category, isNewlyCreated]) {
                models.Cashflow.create({
                dateTime: moment(date,'DD/MM/YYYY').tz("Australia/Sydney"),
                amount: amount,
                shortDescription: shortDescription,
                longDescription: longDescription,
                isExpense: true,
                CategoryId: category.dataValues.id,
                UserId: req.session.user.id
            }).then(function(expense) {
                if (expense == null) {
                    res.status(400).json({
                        errorMsg: "An error occured, try again later"
                    })
                } else {
                    // res.status(200).json({
                    //     msg: "Expense added successfully"
                    // })
                   
                }

            })
             next();
            }).catch(function (err) {
                console.error(err);
                res.status(err.status || 500);
                    res.render('error', {
                    user: req.session.user
                });
            });

        })
            
        .on("data", function(data){

        }).on("end", function(){
           
        });
    }
});
})

router.get('/export', function(req, res) {
        models.Cashflow.findAll({
        where: {
            "isExpense": true
        }
    }).then(function(cashflow) {
            if (cashflow == null) {
                res.status(400).json({
                    errorMsg: "An error occured, try again later"
                })
            } else {
                var fields = ['Expense Date', 'Amount', 'Short Description', 'Long Description'];
                // var arrayList;
                    var data=[];
                    
                    for (var i = 0; i < cashflow.length; i++) {
                        
                        data[data.length] = {
                            "Amount": cashflow[i].dataValues.amount,
                            "Short Description": cashflow[i].dataValues.shortDescription,
                            "Long Description": cashflow[i].dataValues.longDescription,
                            "Expense Date": cashflow[i].dataValues.dateTime
                            }
                    }
                    //var obj = JSON.parse(myCsv);
                    // arrayList.push(obj);
                // }
                // var finalCsv = JSON.stringify(arrayList);
                //var csv = json2csv({ data: data, fields: fields });
                 json2csv({ data: data, fields: fields }, function(err, csv) {
                  if (err) console.log(err);
                  console.log(csv);
                  fs.writeFile('expense.csv', csv, function(err) {
                  if (err) throw err;
                  res.download('expense.csv');
                });
                });
                
                }
        })
})

router.get('/searchExpense', function(req, res) {
        models.Cashflow.findAll().then(function(cashflows){
        
        res.render('searchExpense', {
            title: 'Search Expense',
            user: req.session.user,
            cashflows:cashflows,
            page:1,
            total_page:cashflows.length

        })
     })
        
})

router.get('/editExpense', function(req, res) {
            res.render('editExpense', {
                title: 'Edit Expenses',
                user: req.session.user,
            })
        
        expenseId = req.query['selectpicker'];

})

router.post('/editExpense', function(req, res) {
    if (req.body.category.length == 0) {
        dialog.info("Category can't be null");
        res.redirect("/expenses/editExpense?selectpicker="+expenseId);
    } else if (req.body.amount <= 0) {
        dialog.info("Please enter an amount");
        res.redirect("/expenses/editExpense?selectpicker="+expenseId);
    } else {
         models.Cashflow.find({
        where: {
            id: expenseId
        }
    }).then(function(cashflow) {
        models.Category.find({
            where: {
                id: cashflow.CategoryId
            }
        }).then(function(category) {
            
            if (category) {
                category.updateAttributes({
                    name: req.body.category
                })        
            }
        })
        if (cashflow) {
            cashflow.updateAttributes({
                amount: req.body.amount,
                shortDescription: req.body.shortDescription,
                longDescription: req.body.longDescription,
            })
        } else {
            res.status(400).json({
                errorMsg: "An error occured, try again later"
            })
        }
    })
    res.render('index', {
        title: 'Dashboard',
        user: req.session.user
    })
    }
   

})


router.get('/', function(req, res) {

    models.Cashflow.findAll({

        where:{
            "UserId": req.session.user.id
        },
        include:[
            {model:models.Category,
            
            }


            ]

        }).then(function(cashflows){
        
        res.render('view-history', {
        title: 'view-history',
        user: req.session.user,
        cashflows:cashflows,

        })
         console.log(JSON.stringify(cashflows))
         console.log("-----------------")
         console.log(JSON.stringify(cashflows[0].dataValues))
    })
})

router.post('/', function(req, res) {
    models.Cashflow.findAll().then(function(cashflows){console.log(cashflows)})
    res.status(200).json({
                    msg: " view history"
    })
})



module.exports = router;
