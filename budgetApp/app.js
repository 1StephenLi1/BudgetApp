var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var flash = require('connect-flash');

const fileUpload = require('express-fileupload');

var index = require('./routes/index');
var users = require('./routes/users');
var login = require('./routes/login');
var signup = require('./routes/signup');
var expenses = require('./routes/expenses');
var incomes = require('./routes/incomes');

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
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(flash());
app.use(session({ authenticated: false, cookie: { maxAge: 600000 }, secret: 'secret' }));

// authentication
app.use(function(req, res, next) {
	console.log("Authentication " + req.url);
	if ((req.url != '/login' && req.url != '/signup') && !req.session.authenticated) {
		console.log("Redirecting to login page");
		res.redirect('/login');
		return;
	}
	console.log("Authenticated");
	next();
});

app.use('/', index);
app.use('/users', users);
app.use('/login', login);
app.use('/signup', signup);
app.use('/expenses', expenses);
app.use('/incomes', incomes);

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
