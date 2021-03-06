var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var flash = require('connect-flash');

var $ = require( 'jquery' );

const fileUpload = require('express-fileupload');

var index = require('./routes/index');
var users = require('./routes/users');
var login = require('./routes/login');
var signup = require('./routes/signup');
var expenses = require('./routes/expenses');
var recurringExpenses = require('./routes/recurringExpenses');
var settings = require('./routes/settings');
var incomes = require('./routes/incomes');
var recurringIncomes = require('./routes/recurringIncomes');
var dashboard = require('./routes/dashboard');
var autocomplete = require('./routes/autocomplete');
var portfolio = require('./routes/portfolio');
var goals = require('./routes/goals');

var app = express();

app.use(fileUpload());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser({uploadDir:'/images'}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(flash());
app.use(session({ authenticated: false, reqPath: '/', cookie: { maxAge: 600000 }, secret: 'secret' }));

// authentication
app.use(function(req, res, next) {
	// console.log("Authentication " + req.url);
	if (!req.session.authenticated && (req.url != '/login' && req.url != '/signup' &&
    req.url !='/login/forgotPassword' && req.url.substring(0, 20) !='/login/resetPassword' && req.url.substring(0, 20) != '/login/twoFactorAuth' )) {
      console.log("Redirecting to login page");
      req.session.reqPath = req.path;
      res.redirect('/login');
      return;
  }
  if (req.url != '/login') {
    req.session.reqPath = '/'; // default
  }
	next();
});

app.use('/', index);
app.use('/users', users);
app.use('/login', login);
app.use('/signup', signup);
app.use('/expenses', expenses);
app.use('/recurringExpenses', recurringExpenses);
app.use('/settings', settings);
app.use('/incomes', incomes);
app.use('/recurringIncomes', recurringIncomes);
app.use('/dashboard', dashboard);
app.use('/autocomplete', autocomplete);
app.use('/portfolio', portfolio);
app.use('/goals', goals);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Oops. Page Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.title = "Error - " + err.status
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error', {
	  user: req.session.user
  });
});

module.exports = app;
