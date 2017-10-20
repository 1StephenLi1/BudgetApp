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
var yahooFinance = require('yahoo-finance');
var Sync = require('sync');
var Q = require('q');




router.get('/', function(req, res) {

    models.Portfolio.findAll({
    where:{
        "UserId": req.session.user.id
    }}).then(function(portfolios){

        var i,k,len = portfolios.length;
        var a = [];
        for(i=0;i<len;i++){
            a.push(getQuotes(i,portfolios));
           
        }

        Promise.all(a).then(function(quotesArr) {
            for (portfolio of portfolios) {
                for (quote of quotesArr) {
                    console.log(quotesArr)
                    console.log("portfolio.symbol:" + portfolio.symbol);
                    console.log("quote.symbol:" + quote[0].symbol);

                    if (portfolio.symbol == quote[quote.length-1].symbol) {
                        lastQuote = quote[0];
                        console.log("lastQuote"+quote[0].close);
                        portfolio['lastestPrice'] = lastQuote.close;
                        portfolio['change'] = lastQuote.close-portfolio.boughtPrice;
                        //portfolio['percentChange']= (lastQuote.close-portfolio.boughtPrice)/portfolio.boughtPrice;

                    }
                }
                
            }
            console.log("check portfolios value:");
            //console.log(portfolios);
            console.log(portfolios[0]['change']);

            res.render('portfolio', {
            title: 'Investment Portfolio',
            user: req.session.user,
            portfolios:portfolios
            
            })
        })

        
         
    })
    
   })

function getQuotes(i,portfolios){
 return yahooFinance.historical({
        symbol: portfolios[i]['symbol'],
        from: portfolios[i]['firstTrade']
    });

}


router.get('/addInvestment', function(req, res) {

    res.render('addInvestment', {
        title: 'Add Investment',
        user: req.session.user
    })
})

router.post('/addInvestment', function(req, res) {
        if (req.body.symbol.length == 0) {
            dialog.info("Please enter a symbol");
            res.redirect("/portfolio/addInvestment");
        } else if (req.body.shareAmount <= 0) {
            dialog.info("Please enter an amount");
            res.redirect("/portfolio/addInvestment");
        } else if (req.body.boughtPrice <= 0.00) {
            dialog.info("Please enter a price");
            res.redirect("/portfolio/addInvestment");
        } else {
            yahooFinance.historical({
                symbol: req.body.symbol,
  // period: 'd'  // 'd' (daily), 'w' (weekly), 'm' (monthly), 'v' (dividends only)
            }, function (err, quotes) {
                console.log("quotes : " + quotes.length );
            if (quotes.length == 0) {
                dialog.info("Please enter a valid symbol");
                res.redirect("/portfolio/addInvestment");
            } else {
                models.Portfolio.create({
                    firstTrade: moment(req.body.expenseDate,'DD/MM/YYYY').tz("Australia/Sydney"),
                    boughtPrice: req.body.boughtPrice,
                    shareAmount: req.body.shareAmount,
                    symbol: req.body.symbol,
                    UserId: req.session.user.id
                }).then(function(portfolio) {
                    if (portfolio == null) {
                        res.status(400).json({
                            errorMsg: "An error occured, try again later"
                        })
                    } else {
                       res.render('portfolio', {
                            title: 'Investment Portfolio',
                            user: req.session.user
                        })
                    }
                })
            }
        });
           
        }

    })
    

    


module.exports = router;