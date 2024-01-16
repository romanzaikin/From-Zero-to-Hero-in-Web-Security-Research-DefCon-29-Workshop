const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const fileUpload = require('express-fileupload');           // handle file uploads
const session = require('express-session');
const bodyParser = require('body-parser');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const urls = require('./routes/urls');
const api = require('./routes/api');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// set protection headers
app.use(function (req, res, next) {

  // CSP Header
  // res.setHeader("Content-Security-Policy", "default-src 'none'; script-src 'self'; connect-src 'self'; font-src 'self'; img-src 'self'; style-src 'self' 'unsafe-inline';");

  // CORS
  //res.setHeader("Access-Control-Allow-Origin", "*");

  // ClickJAcking
  //res.setHeader("X-Frame-Options", "DENY");
  //res.setHeader("Content-Security-Policy", "frame-ancestors 'none';");

  // General Headers
  //res.setHeader("X-Content-Type-Options", "nosniff");

  next();
});

// Information Disclosure
// app.disable('x-powered-by');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(bodyParser.text());

// parse text/xml
app.use(bodyParser.text({ type: 'text/xml' }));

app.use(fileUpload({
  safeFileNames: false,
  createParentPath: true,
  limits: { fileSize: 50 * 1024 * 1024 },
  preserveExtension: true
}));

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'My API',
    version: '1.0.0',
    description: 'My API Documentation',
  },
};

const options = {
  swaggerDefinition,
  // Paths to files containing OpenAPI definitions
  apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(session({
  name: 'session',
  secret: '156cd512-c40e-4fe3-96f6-d3489e15bcdd-eb67b26d-ba75-46a7-a441-ab82dfe24562',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: false,
    secure: false
  }
}))

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', urls);
app.use('/', api);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  //next(createError(404));

  return res.redirect("/");
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
