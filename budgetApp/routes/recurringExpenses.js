var express = require('express');
var router = express.Router();
var models = require('../models');
var moment = require('moment-timezone');
var later = require('later');
var Sequelize = require("sequelize");

// Get View Recurring Expenses Page
router.get('/', function(req, res) {
    models.Category.findAll({
        where: {
            type: "expense"
        }
    }).then(function(categories) {
        res.render('recurringExpenses/recurringExpenses', {
            title: 'All Recurring Expenses',
            user: req.session.user,
            categories: categories
        })
    })
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

    // //Set start date to start at midnight
    // var startDate = moment(req.body.startDate)
    // startDate.millisecond(0);
    // startDate.seconds(0);
    // startDate.minutes(0);
    // startDate.hours(0);
    //
    // // Set end date to finish at 11:59:59 PM
    // var endDate = moment(req.body.endDate);
    // endDate.millisecond(999);
    // endDate.seconds(59);
    // endDate.minutes(59);
    // endDate.hours(23);

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

    models.Recurring.count({
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
            // dateTime: {
            //     $lte: endDate.toDate(),
            //     $gte: startDate.toDate()
            // }
        }
    }).then(function(recurringExpensesCount) {
        models.Recurring.findAndCountAll({
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
                // dateTime: {
                //     $lte: endDate.toDate(),
                //     $gte: startDate.toDate()
                // }
            },
            order: order,
            offset: start,
            limit: limit
        }).then(function(filteredRecurringExpenses) {
            res.json({
                data: filteredRecurringExpenses.rows,
                recordsTotal: recurringExpensesCount,
                recordsFiltered: filteredRecurringExpenses.count
            })
        })
    })
})

router.get('/addRecurringExpense', function(req, res) {
    res.render('recurringExpenses/addRecurringExpense', {
        title: 'Add Recurring Expense',
        user: req.session.user
    })
})

router.post('/addRecurringExpense', function(req, res) {
    if (req.session.user == null || req.session.user.id == null) {
        res.json({
            status: "error",
            message: "You must be logged in to create an recurring expense"
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
        }).spread(function(category, created) {
            var frequency = req.body.frequency;
            var interval = req.body.interval;
            var startsOn;
            var endsOn;
            var repeatsOn = "";

            if (req.body.startsOnRadio == "now") {
                startsOn = new Date();
            } else {
                startsOn = req.body.startsOnDate;
            }

            if (req.body.endsOnRadio == "never") {
                endsOn = null;
            } else {
                endsOn = req.body.endsOnDate;
            }

            models.Recurring.create({
                amount: req.body.amount,
                shortDescription: req.body.shortDescription,
                longDescription: req.body.longDescription,
                isExpense: true,
                CategoryId: category.dataValues.id,
                UserId: req.session.user.id,
                startDate: startsOn,
                endDate: endsOn,
                frequency: frequency,
                interval: interval
            }).then(function(recurring) {
                var textSched = "";
                var recurringId = recurring.id;

                if (frequency == "days") {
                    textSched = 'every ' + interval + ' minutes';

                    // var s = later.parse.recur()
                    //     .every(interval*24).hour()
                    var s = later.parse.text(textSched);
                } else if (frequency == "weeks") {
                    repeatsOn = req.body.repeatsOn;
                    // var s = later.parse.recur()
                    //     //.on('08:00:00').time()
                    //     .on(repeatsOn).dayOfWeek()
                    textSched = 'every ' + interval + ' weeks on ' + repeatsOn;
                    var s = later.parse.text(textSched);

                } else {
                    textSched = 'every ' + interval + ' months';
                    var s = later.parse.text(textSched);
                }

                setSchedule(s, recurringId)

                res.json({
                    status: "success",
                    message: "A recurring expense has been created"
                })
            })
        }).catch(function (err) {
            res.json({
                status: "error",
                message: "An error occured while adding expense, try again later"
            })
        });
    }
})


function setSchedule(schedule, recurringId) {
    var t = later.setInterval(function() {
        models.Recurring.findOne({
            where: {
                id: recurringId
            }
        }).then(function(oldRecurring) {
            models.Cashflow.create({
                dateTime: moment().tz("Australia/Sydney"),
                amount: oldRecurring.amount,
                shortDescription: oldRecurring.shortDescription,
                longDescription: oldRecurring.longDescription,
                isExpense: true,
                CategoryId: oldRecurring.CategoryId,
                UserId: oldRecurring.UserId,
                RecurringId: oldRecurring.id
            })
        });
    }, schedule);

    return t
}
module.exports = router;
