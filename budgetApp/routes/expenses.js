var express = require('express');
var router = express.Router();
var models = require('../models');
var moment = require('moment-timezone');
var csv = require('fast-csv');
var fs = require('fs');
var mv = require('mv');
var http = require('http');
var json2csv = require('json2csv');
var dialog = require('dialog');
var Sequelize = require("sequelize");

var categoryUrlQuery;
router.get('/', function(req, res) {
    models.Category.findAll({
        where: {
            type: "expense"
        }
    }).then(function(categories) {
        res.render('expenses/expenses', {
            title: 'All Expenses',
            user: req.session.user,
            categories: categories
        })
    })
    categoryUrlQuery = req.query['category'];
})

router.post('/datatable', function(req, res) {
    var start = parseInt(req.body.start);
    var limit = parseInt(req.body.length);
    orderColTarget = req.body['order[0][column]'];
    orderColName = req.body['columns['+orderColTarget+'][name]']
    order = [[orderColName, req.body['order[0][dir]']]];

    if (orderColName == "dateTime") {
        order.push(['createdAt', req.body['order[0][dir]']])
    }

    var searchTerms = req.body['search[value]'];
    if (searchTerms != null && searchTerms != undefined){
        var searchQuery = {
            $and: [
                Sequelize.where(Sequelize.fn('concat', Sequelize.col('Category.name'), ' ', Sequelize.col('shortDescription'), ' ', Sequelize.col('longDescription')), {
                    like: '%' + searchTerms + '%'
                })
            ]
        };
    }

    //Set start date to start at midnight
    var startDate = moment(req.body.startDate)
    startDate.millisecond(0);
    startDate.seconds(0);
    startDate.minutes(0);
    startDate.hours(0);

    // Set end date to finish at 11:59:59 PM
    var endDate = moment(req.body.endDate);
    endDate.millisecond(999);
    endDate.seconds(59);
    endDate.minutes(59);
    endDate.hours(23);

    var categoriesQuery

    // Categories Filters
    if (req.body.categories != undefined) {
        categoriesQuery = [];
        for (categoryId of JSON.parse(req.body.categories)) {
            categoriesQuery.push({"CategoryId": categoryId});
        }
    } else {
        if (categoryUrlQuery == null) {
            categoriesQuery = [{"CategoryId": null},{"CategoryId": {$ne:null}}];    
        } else {
            models.Category.findOne({
                where: {
                    name: categoryUrlQuery
                }
            }).then(function(category) {
                categoriesQuery = [{"CategoryId": category.dataValues.id}];
                models.Cashflow.count({
        include: [
            {
                model: models.Category,
                attributes: ['name'],
                where: {
                    type: 'expense'
                }
            },
        ],
        where: {
            UserId: req.session.user.id,
            isExpense: true,
            searchQuery,
            $or: categoriesQuery,
            dateTime: {
                $lte: endDate.toDate(),
                $gte: startDate.toDate()
            }
        }
    }).then(function(expensesCount) {
        models.Cashflow.findAndCountAll({
            include: [
                {
                    model: models.Category,
                    attributes: ['name'],
                    where: {
                        type: 'expense'
                    }
                },
            ],
            where: {
                UserId: req.session.user.id,
                isExpense: true,
                searchQuery,
                $or: categoriesQuery,
                dateTime: {
                    $lte: endDate.toDate(),
                    $gte: startDate.toDate()
                }
            },
            order: order,
            offset: start,
            limit: limit
        }).then(function(filteredExpenses) {
            res.json({
                data: filteredExpenses.rows,
                recordsTotal: expensesCount,
                recordsFiltered: filteredExpenses.count
            })
        })
    })
            })
        }
        
    }

    models.Cashflow.count({
        include: [
            {
                model: models.Category,
                attributes: ['name'],
                where: {
                    type: 'expense'
                }
            },
        ],
        where: {
            UserId: req.session.user.id,
            isExpense: true,
            searchQuery,
            $or: categoriesQuery,
            dateTime: {
                $lte: endDate.toDate(),
                $gte: startDate.toDate()
            }
        }
    }).then(function(expensesCount) {
        models.Cashflow.findAndCountAll({
            include: [
                {
                    model: models.Category,
                    attributes: ['name'],
                    where: {
                        type: 'expense'
                    }
                },
            ],
            where: {
                UserId: req.session.user.id,
                isExpense: true,
                searchQuery,
                $or: categoriesQuery,
                dateTime: {
                    $lte: endDate.toDate(),
                    $gte: startDate.toDate()
                }
            },
            order: order,
            offset: start,
            limit: limit
        }).then(function(filteredExpenses) {
            res.json({
                data: filteredExpenses.rows,
                recordsTotal: expensesCount,
                recordsFiltered: filteredExpenses.count
            })
        })
    })
})

router.get('/addExpense', function(req, res) {
    res.render('expenses/addExpense', {
        title: 'Add Expense',
        user: req.session.user
    })
})


router.post('/addExpense', function(req, res) {
    if (req.session.user == null || req.session.user.id == null) {
        res.json({
            status: "error",
            message: "You must be logged in to create an expense"
        })
    } else if (req.body.category == null || req.body.category.length == 0) {
        res.json({
            status: "error",
            message: "Category is a required field"
        })
    } else if (req.body.shortDescription.length > 100) {
        res.json({
            status: "error",
            message: "Short Description of an expense can not be greater than 100 characters"
        })
    } else if (req.body.amount == null || req.body.amount <= 0) {
        // error must have amount > 0
        res.json({
            status: "error",
            message: "Expense amount must be greater than $0.00"
        })
    } else {
        models.Category.findOrCreate({
            where: {
                UserId: req.session.user.id,
                type: "expense",
                name: req.body.category
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
            }).then(function(income) {
                if (income == null) {
                    res.json({
                        status: "error",
                        message: "An error occured while adding expense, try again later"
                    })
                } else {
                    res.json({
                        status: "success",
                        message: "expense was added successfully"
                    })
                }
            })
        }).catch(function (err) {
            res.json({
                status: "error",
                message: "An error occured while adding expense, try again later"
            })
        });
    }
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
        res.render('expenses/addExpense', {
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
            res.redirect('/expenses')
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
            "isExpense": true,
            "UserId": req.session.user.id
        },
        include: [
            {
                model: models.Category,
            }
        ]
    }).then(function(cashflow) {
            if (cashflow == null) {
                res.status(400).json({
                    errorMsg: "An error occured, try again later"
                })
            } else {
                var fields = ['Category' ,'Expense Date', 'Amount', 'Short Description', 'Long Description'];
                // var arrayList;
                    var data=[];
                    console.log("Category: +++ " + cashflow);
                    for (var i = 0; i < cashflow.length; i++) {

                            data[data.length] = {
                                "Category": cashflow[i].Category.name,
                                "Amount": cashflow[i].dataValues.amount,
                                "Short Description": cashflow[i].dataValues.shortDescription,
                                "Long Description": cashflow[i].dataValues.longDescription,
                                "Expense Date": cashflow[i].dataValues.dateTime
                            }


                    }
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

var newCategoryId;
router.get('/editExpense', function(req, res) {

        models.Cashflow.findOne({
            where: {
                id: req.query['id']
            }
        }).then(function(cf){
            models.Category.findOne({
                where: {
                    id: cf.dataValues.CategoryId
                }
            }).then(function(cat) {
                res.render('editExpense', {
                    title: 'Edit Expenses',
                    user: req.session.user,
                    cashflow: cf,
                    category: cat
                })
            })
        })


        expenseId = req.query['id'];
        console.log("expenseId :"  + expenseId);
})

router.post('/editExpense', function(req, res) {
    if (req.body.category.length == 0) {
        dialog.info("Category can't be null");
        res.redirect("/expenses/editExpense?id="+expenseId);
    } else if (req.body.amount <= 0) {
        dialog.info("Please enter an amount");
        res.redirect("/expenses/editExpense?id="+expenseId);
    } else {
        // models.Category.findOrCreate({
        //      where: {
        //         UserId: req.session.user.id,
        //         type: "expense",
        //         name: req.body.category
        //     },
        //     default: {
        //         "isArchived": 0
        //     }
        // }).then(function(category) {
        //     models.Cashflow.findOne({
        //         where: {
        //             id: expenseId
        //         }
        //     }).then(function(cashflow) {
        //         cashflow.updateAttributes({
        //             CategoryId: category.dataValues.id,
        //             amount: req.body.amount,
        //             shortDescription: req.body.shortDescription,
        //             longDescription: req.body.longDescription,
        //         })
        //     })
        // })
    models.Cashflow.find({
        where: {
            id: expenseId
        }
    }).then(function(cashflow) {
        console.log("category from web: +++++++++++++++++++++" + req.body.category);
        console.log("category from web: +++++++++++++++++++++" + req.body.category);
        console.log("category from web: +++++++++++++++++++++" + req.body.category);
        console.log("category from web: +++++++++++++++++++++" + req.body.category);
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
            console.log("Category found: +++++++++++++++++" + category.dataValues.id);
             cashflow.updateAttributes({
            CategoryId: category.dataValues.id,
            amount: req.body.amount,
            shortDescription: req.body.shortDescription,
            longDescription: req.body.longDescription,
        })
        })

        
        if (cashflow) {
            
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

router.delete('/:id', function(req, res) {
    models.Cashflow.destroy({
        where: {
            id: req.params.id,
            isExpense: true,
            UserId: req.session.user.id
        }
    }).then(function() {
        res.json({
            status: "success",
            message: "Expense has been deleted"
        })
    })
})


module.exports = router;