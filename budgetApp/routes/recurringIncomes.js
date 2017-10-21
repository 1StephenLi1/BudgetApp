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

// Get View Recurring Incomes Page
router.get('/', function(req, res) {
    models.Category.findAll({
        where: {
            type: "income"
        }
    }).then(function(categories) {
        res.render('recurringIncomes/recurringIncomes', {
            title: 'All Recurring Incomes',
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
                    type: 'income'
                }
            },
        ],
        where: {
            UserId: req.session.user.id,
            isExpense: false,
            searchQuery,
            $or: categoriesQuery,
            // dateTime: {
            //     $lte: endDate.toDate(),
            //     $gte: startDate.toDate()
            // }
        }
    }).then(function(recurringIncomesCount) {
        models.Recurring.findAndCountAll({
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
                // dateTime: {
                //     $lte: endDate.toDate(),
                //     $gte: startDate.toDate()
                // }
            },
            order: order,
            offset: start,
            limit: limit
        }).then(function(filteredRecurringIncomes) {
            res.json({
                data: filteredRecurringIncomes.rows,
                recordsTotal: recurringIncomesCount,
                recordsFiltered: filteredRecurringIncomes.count
            })
        })
    })
})

router.get('/addRecurringIncome', function(req, res) {
    res.render('recurringIncomes/addRecurringIncome', {
        title: 'Add Recurring Income',
        user: req.session.user
    })
})

router.post('/addRecurringIncome', function(req, res) {
    if (req.session.user == null || req.session.user.id == null) {
        res.json({
            status: "error",
            message: "You must be logged in to create an recurring income"
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
                isArchived: false
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
                isExpense: false,
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
                    message: "A recurring income has been created"
                })
            })
        }).catch(function (err) {
            console.error(err)
            res.json({
                status: "error",
                message: "An error occured while adding income, try again later"
            })
        });
    }
})

//
router.delete('/:id', function(req, res) {
    models.Recurring.findOne({
        where: {
            id: req.params.id,
            isExpense: false,
            UserId: req.session.user.id
        }
    }).then(function(recurring){
        if (recurring == null || recurring == undefined) {
            res.status(400).json({
                status: "error",
                message: "Recurring income does not exist"
            })
        } else if (recurring.isArchived) {
            res.status(400).json({
                status: "error",
                message: "Recurring income has already been cancelled"
            })
        } else if (moment(recurring.endDate).isBefore(moment())) {
            res.status(400).json({
                status: "error",
                message: "Recurring income has already ended"
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
                    message: "Recurring income has been deleted"
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
                    message: "Recurring income has been cancelled"
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
                    isExpense: false,
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
                            isExpense: false,
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
                isExpense: false
            }
        });

}


module.exports = router;
