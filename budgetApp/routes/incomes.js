var express = require('express');
var router = express.Router();
var models = require('../models');
var moment = require('moment-timezone');
var csv = require('fast-csv');
var fs = require('fs');
var Sequelize = require("sequelize");

/* GET home page. */
router.get('/', function(req, res, next) {
    models.Category.findAll({
        where: {
            type: "income"
        }
    }).then(function(categories) {
        res.render('incomes/incomes', {
            title: 'All Incomes',
            user: req.session.user,
            categories: categories
        })
    })
});

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
        categoriesQuery = [{"CategoryId": null},{"CategoryId": {$ne:null}}];
    }

    models.Cashflow.count({
        include: [
            {
                model: models.Category,
                attributes: ['name'],
                where: {
                    type: 'income'
                }
            },
        ],
        where: {
            UserId: req.session.user.id,
            isExpense: false,
            searchQuery,
            $or: categoriesQuery,
            dateTime: {
                $lte: endDate.toDate(),
                $gte: startDate.toDate()
            }
        }
    }).then(function(incomesCount) {
        models.Cashflow.findAndCountAll({
            include: [
                {
                    model: models.Category,
                    attributes: ['name'],
                    where: {
                        type: 'income'
                    }
                },
            ],
            where: {
                UserId: req.session.user.id,
                isExpense: false,
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
        }).then(function(filteredIncomes) {
            res.json({
                data: filteredIncomes.rows,
                recordsTotal: incomesCount,
                recordsFiltered: filteredIncomes.count
            })
        })
    })
})

router.get('/addIncome', function(req, res) {
    res.render('incomes/addIncome', {
        title: 'Add Income',
        user: req.session.user
    })
})

router.post('/addIncome', function(req, res) {
    if (req.session.user == null || req.session.user.id == null) {
        res.json({
            status: "error",
            message: "You must be logged in to create an income"
        })
    } else if (req.body.category == null || req.body.category.length == 0) {
        res.json({
            status: "error",
            message: "Category is a required field"
        })
    } else if (req.body.shortDescription.length > 100) {
        res.json({
            status: "error",
            message: "Short Description of an income can not be greater than 100 characters"
        })
    } else if (req.body.amount == null || req.body.amount <= 0) {
        // error must have amount > 0
        res.json({
            status: "error",
            message: "Income amount must be greater than $0.00"
        })
    } else {
        models.Category.findOrCreate({
            where: {
                UserId: req.session.user.id,
                type: "income",
                name: req.body.category
            },
            default: {
                "isArchived": 0
            }
        }).then(function([category, isNewlyCreated]) {
            models.Cashflow.create({
                dateTime: moment(req.body.incomeDate,'DD/MM/YYYY').tz("Australia/Sydney"),
                amount: req.body.amount,
                shortDescription: req.body.shortDescription,
                longDescription: req.body.longDescription,
                isExpense: false,
                CategoryId: category.dataValues.id,
                UserId: req.session.user.id
            }).then(function(income) {
                if (income == null) {
                    res.json({
                        status: "error",
                        message: "An error occured while adding income, try again later"
                    })
                } else {
                    res.json({
                        status: "success",
                        message: "Income was added successfully"
                    })
                }
            })
        }).catch(function (err) {
            res.json({
                status: "error",
                message: "An error occured while adding income, try again later"
            })
        });
    }
})

router.delete('/:id', function(req, res) {
    models.Cashflow.destroy({
        where: {
            id: req.params.id,
            isExpense: false,
            UserId: req.session.user.id
        }
    }).then(function() {
        res.json({
            status: "success",
            message: "Income has been deleted"
        })
    })
})


module.exports = router;
