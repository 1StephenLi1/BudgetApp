var express = require('express');
var router = express.Router();
var models = require('../models');
var moment = require('moment-timezone');
var later = require('later');
var CronJob = require('cron').CronJob;
var Sequelize = require("sequelize");

var activeJobs = []; // Array of all jobs that are currently active (i,e running)
var jobStartJobs = []; // Array of jobs that schedule the start of another job
var jobEndJobs = []; // Array of jobs that schedule the end of another job

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
            var repeatsOn;
            var isActive;
            if (req.body.repeatsOn != null && req.body.repeatsOn != undefined) {
                repeatsOn = req.body.repeatsOn;
            } else {
                repeatsOn = null;
            }

            if (req.body.startsOnRadio == "now") {
                startsOn = new Date();
                isActive = true;
            } else {
                startsOn = req.body.startsOnDate;
                isActive = false;
            }

            if (req.body.endsOnRadio == "never") {
                endsOn = null;
            } else {
                endsOn = moment(req.body.endsOnDate, "DD/MM/YYYY").tz("Australia/Sydney");
            }

            models.Recurring.create({
                amount: req.body.amount,
                shortDescription: req.body.shortDescription,
                longDescription: req.body.longDescription,
                isExpense: true,
                isActive: isActive,
                CategoryId: category.id,
                UserId: req.session.user.id,
                startDate: moment(startsOn, "DD/MM/YYYY").tz("Australia/Sydney"),
                endDate: endsOn,
                frequency: frequency,
                interval: interval,
                repeatsOn: repeatsOn
            }).then(function(recurring) {
                var cronTime = ""
                var recurringId = recurring.id;

                if (frequency == "minutes") {
                    cronTime = '*/' + interval + ' * * * *'
                } else if (frequency == "days") {
                    cronTime = '* * */' + interval + ' * *'
                } else if (frequency == "weeks") {
                    repeatsOn = req.body.repeatsOn;
                    cronTime = '* * */' + (7*interval) + ' * ' + repeatsOn
                } else {
                    cronTime = '* * * */' + interval + ' *'
                }

                setJobSchedule(cronTime, recurring, req.body.startsOnRadio)

                res.json({
                    status: "success",
                    message: "A recurring expense has been created"
                })
            })
        }).catch(function (err) {
            console.error(err)
            res.json({
                status: "error",
                message: "An error occured while adding expense, try again later"
            })
        });
    }
})

//
router.delete('/:id', function(req, res) {
    models.Recurring.findOne({
        where: {
            id: req.params.id,
            isExpense: true,
            UserId: req.session.user.id
        }
    }).then(function(recurring){
        if (recurring == null || recurring == undefined) {
            res.status(400).json({
                status: "error",
                message: "Recurring expense does not exist"
            })
        } else if (recurring.isArchived) {
            res.status(400).json({
                status: "error",
                message: "Recurring expense has already been cancelled"
            })
        } else if (moment(recurring.endDate).isBefore(moment())) {
            res.status(400).json({
                status: "error",
                message: "Recurring expense has already ended"
            })
        } else if (moment(recurring.startDate).isAfter(moment())){
            models.Recurring.destroy({
                where: {
                    id: req.params.id,
                    UserId: req.session.user.id
                }
            }).then(function() {
                cancelJob(recurring.id);
                res.status(200).json({
                    status: "success",
                    message: "Recurring expense has been deleted"
                })
            })
        } else {
            models.Recurring.update({
                isActive: false,
                isArchived: true
            }, {
                where: {
                    id: req.params.id,
                    UserId: req.session.user.id
                }
            }).then(function() {
                cancelJob(recurring.id);
                res.status(200).json({
                    status: "success",
                    message: "Recurring expense has been cancelled"
                })
            })
        }
    })
})

function setJobSchedule(cronTime, recurring, startsOnRadio) {
    // IF startDate not set start immediately
    // IF END date is set set up a job to cancel this

    if (startsOnRadio == "now") {
        var job = new CronJob({
            cronTime: cronTime,
            onTick: function() {
                models.Cashflow.create({
                    dateTime: moment().tz("Australia/Sydney"),
                    amount: recurring.amount,
                    shortDescription: recurring.shortDescription,
                    longDescription: recurring.longDescription,
                    isExpense: true,
                    CategoryId: recurring.CategoryId,
                    UserId: recurring.UserId,
                    RecurringId: recurring.id
                })
            },
            start: false,
            timeZone: 'Australia/Sydney'
        });

        job.start();
        job.recurringId = recurring.id;
        activeJobs.push(job);

        if (recurring.endDate != null) {
            var endJob = new CronJob({
                cronTime: moment(recurring.endDate).tz("Australia/Sydney").toDate(),
                onTick: function() {
                    cancelJob(recurring.id)
                    this.stop()
                },
                start: false,
                timeZone: 'Australia/Sydney'
            })

            endJob.start();
            endJob.recurringId = recurring.id;
            jobEndJobs.push(endJob);
        }
    } else {
        var startJob = new CronJob({
            cronTime: moment(recurring.startDate).tz("Australia/Sydney").toDate(),
            onTick: function() {
                var job = new CronJob({
                    cronTime: cronTime,
                    onTick: function() {
                        models.Cashflow.create({
                            dateTime: moment().tz("Australia/Sydney"),
                            amount: recurring.amount,
                            shortDescription: recurring.shortDescription,
                            longDescription: recurring.longDescription,
                            isExpense: true,
                            CategoryId: recurring.CategoryId,
                            UserId: recurring.UserId,
                            RecurringId: recurring.id
                        })
                    },
                    start: false,
                    timeZone: 'Australia/Sydney'
                });

                job.start();
                job.recurringId = recurring.id;
                activeJobs.push(job);

                if (recurring.endDate != null) {
                    var endJob = new CronJob({
                        cronTime: moment(recurring.endDate).tz("Australia/Sydney").toDate(),
                        onTick: function() {
                            cancelJob(recurring.id)
                            this.stop()
                        },
                        start: false,
                        timeZone: 'Australia/Sydney'
                    })

                    endJob.start();
                    endJob.recurringId = recurring.id;
                    jobEndJobs.push(endJob);
                }

                this.stop();
            },
            start: false,
            timeZone: 'Australia/Sydney'
        })

        startJob.start();
        startJob.recurringId = recurring.id;
        jobStartJobs.push(startJob);
    }
}

function cancelJob(recurringId) {
    for (i = 0; i < jobStartJobs.length; i++) {
        if (jobStartJobs[i].recurringId == recurringId) {
            jobStartJobs[i].stop();
            jobStartJobs.splice(i, 1);
            break;
        }
    }

    for (i = 0; i < jobEndJobs.length; i++) {
        if (jobEndJobs[i].recurringId == recurringId) {
            jobEndJobs[i].stop();
            jobEndJobs.splice(i, 1);
            break;
        }
    }

    for (i = 0; i < activeJobs.length; i++) {
        if (activeJobs[i].recurringId == recurringId) {
            activeJobs[i].stop();
            activeJobs.splice(i, 1);
            break;
        }
    }

    return models.Recurring.update({
            isActive: false,
            endDate: moment().tz("Australia/Sydney")
        }, {
            where: {
                id: recurringId,
                isExpense: true
            }
        });

}


module.exports = router;
