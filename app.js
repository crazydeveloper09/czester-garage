const express               = require("express"),
      app                   = express(),
      mongoose              = require("mongoose"),
      passport              = require("passport"),
      User                  = require("./models/user"),
      userRoutes            = require("./routes/user"),
      apiRoutes             = require("./routes/api"),
      indexRoutes           = require("./routes/index"),
      servicesRoutes        = require("./routes/service"),
      whyHeresRoutes        = require("./routes/whyHere"),
      LocalStrategy         = require("passport-local"),
      mongoSanitize         = require("express-mongo-sanitize"),
      helmet                = require("helmet"),
      flash                 = require("connect-flash"),
      dotenv                = require("dotenv"),
      methodOverride        = require("method-override");



app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
app.use(mongoSanitize());
app.use(helmet({
    contentSecurityPolicy: false,
}))
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
dotenv.config();

mongoose.connect(process.env.DATABASE_URL, {useNewUrlParser: true})


app.use(require("express-session")({
    secret: "heheszki",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        
    }
}));
app.use(function(req, res, next) {
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    res.locals.currentUser = req.user;
   
    next();
});
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use("/services", servicesRoutes);
app.use("/users", userRoutes);
app.use("/api", apiRoutes);
app.use("/services/:service_id/whyHere", whyHeresRoutes);
app.use(indexRoutes);

app.listen(process.env.PORT)



