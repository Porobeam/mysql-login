const express = require('express');
const morgan = require('morgan');
const path = require('path');
const mysql = require('mysql');
const myConnection = require('express-myconnection');
const hbs = require('hbs');
const hbsUtils = require('hbs-utils')(hbs);
const session = require('express-session');
require('dotenv').config();

// express
const app = express();

// settings
app.set('port', process.env.PORT || 3000);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'src', 'views'));
hbs.registerPartials(__dirname + '/src/views/partials', function (err) {});
hbsUtils.registerPartials(__dirname + '/views/partials');
hbsUtils.registerWatchedPartials(__dirname + '/views/partials');

// middlewares
app.use(morgan('dev'));
app.use(myConnection(mysql, {
    host: 'localhost',
    user: 'root',
    password: 'contraseña',
    port: 3306,
    database: 'login_project'
}, 'single'));

app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

app.use(express.urlencoded({ extended: false }));

// static files
app.use(express.static(path.join(__dirname, 'public')));

// routes
const indexRoute = require('./src/routes/index');
const authRoute = require('./src/routes/auth');
app.use('/', indexRoute);
app.use('/auth', authRoute);

// starting the server
app.listen(app.get('port'), () => {
    console.log(`Server on port ${app.get('port')}`);
});
