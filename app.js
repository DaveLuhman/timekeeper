// dev depenancies
// eslint-disable-next-line no-unused-vars
import  '@colors/colors'
import 'dotenv/config'
import { scheduledTasks } from './automation/cron.js';
// express depenancies
import cookieParser from 'cookie-parser';
import express from 'express';
// handlebars depenancies
import { create } from 'express-handlebars'; // templating engine
import handlebarsHelpers from 'handlebars-helpers';
import paginate from 'handlebars-paginate';
import { formatDate } from './helpers/index.js';
// utility depenancies
import { mw, globalRateLimiter, authRateLimiter } from './middleware/util.js';
import { ensureFingerprint } from './middleware/fingerprint.js';
import flash from 'express-flash';
import connectDB from './config/db.js';
import errorHandler from './middleware/error.js';
import { prodConfig } from './config/prod.config.js';
import { adminRouter } from './routes/admin/admin.routes.js';
import { checkAuth } from './middleware/auth.js';
import { apiRouter } from './routes/api/api.routes.js';
import { authRouter } from './routes/auth/auth.routes.js';
import { indexRouter } from './routes/index.routes.js';
import { devConfig } from './config/dev.config.js';
import passportConfig from './config/passport.js';
import passport from 'passport'
connectDB()

scheduledTasks()
const PORT = process.env.PORT || 3000;
const app = express(); // Create Express App
app.use(cookieParser());
app.use(ensureFingerprint);

/** session config
 * conditional on process.env.NODE_ENV
**/
if (process.env.NODE_ENV === 'PRODUCTION') {
  app.use(prodConfig)
  app.set('trust proxy', 1)
  console.log('Running in production'.green.bgBlack)
}
else {
  app.use(devConfig)
  console.log('Running in development mode'.blue.bgYellow)
}
// end session config
// passport config
app.use(express.urlencoded({ extended: false })); // Parse URL-encoded values
passportConfig(app)
app.use(passport.initialize())
app.use(passport.session())
// end passport config

// Handlebars Setup
const hbs = create({
  helpers: {
    formatDate,
    paginate,
    ...handlebarsHelpers()
  },
  extname: '.hbs',
  defaultLayout: 'main',
  partialsDir: ['./views/partials', './views/partials/modals'],
  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
    allowProtoMethodsByDefault: true,
  },
});
app.engine('.hbs', hbs.engine);
app.set('view engine', '.hbs');
app.set('views', './views');
// end hbs config

// Express Middleware
app.use('/', express.static('./public')); // Serve Static Files
app.use(express.json()); // JSON Body Parser
app.use(globalRateLimiter);
app.use(flash())
app.use(mw)
// end express middleware
// Routes (No User Context)
app.use('/', indexRouter);
app.use('/api', apiRouter)
app.use('/auth', authRateLimiter, authRouter)
// Routes (User Context)
app.use(checkAuth)
app.use('/admin', adminRouter)
// catch 404 and forward to error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.info(`[INIT] Server is running on port ${PORT}`);
});
