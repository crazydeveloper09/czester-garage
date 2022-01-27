const express = require("express"),
    User = require("../models/user"),
    Service = require("../models/service"),
    passport = require("passport"),
    router = express.Router();

let admin_username = "admin";

router.get("/", (req, res) => {
    Service.find({ chosen: true }, (err, services) => {
        if(err){
            console.log(err)
        } else {
            User.findOne({username: admin_username}).populate("pictures").exec((err, admin) => {
                let header = `Strona Główna | Czester Garage`;
                res.render("index", {currentUser: req.user, header: header, services: services, admin: admin});
            });
        }
    })
   
})

    
router.get("/contact", function(req, res){
    User.findOne({username: admin_username}, (err, admin) => {
        let header = `Kontakt | Czester Garage`;
        res.render("contact", {admin:admin, header: header, currentUser: req.user});
    });
	
});
router.post("/login",function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
      if (err) { return next(err); }
      if (!user) { 
         req.flash("error", "Zła nazwa użytkownika lub hasło");
          return res.redirect(`/login?return_route=${req.query.return_route}`); 
        }
      req.logIn(user, function(err) {
        if (err) { return next(err); }
        return res.redirect("/");
      });
    })(req, res, next);
    
});
router.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/login");
});
router.get("/login", function(req, res){
    let header = `Logowanie | Czester-garage`;
	res.render("login", {header: header})
});

router.get("/register", function(req, res){
    let header = `Rejestracja | Czester-garage`;
	res.render("./users/new", {header: header})
});

router.post("/register", function(req, res){
    let newUser = new User({
        username: req.body.username,
        email: req.body.email
    });
    User.register(newUser, req.body.password, function(err, user) {
        if(err) {
            let header = `Rejestracja | Czester-garage`;
            return res.render("register", {header: header});
        } 
        passport.authenticate("local")(req, res, function() {
            
            res.redirect("/login");
        });
    });
});




module.exports = router;