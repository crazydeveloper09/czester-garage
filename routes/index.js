const express = require("express"),
    User = require("../models/user"),
    Service = require("../models/service"),
    async = require("async"),
    crypto = require("crypto"),
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
router.get("/privacy-policy", (req, res) => {
    res.render("policy", {header: "Polityka prywatności i klauzula RODO"})
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
        return res.redirect(req.query.return_route);
      });
    })(req, res, next);
    
});
router.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/login?return_route=/");
});
router.get("/login", function(req, res){
    let header = `Logowanie | Czester-garage`;
	res.render("login", {header: header, return_route: req.query.return_route})
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

router.get("/forgot", function(req, res){
    let header = `Poproś o zmianę hasła | Czester Garage`;
    res.render("forgot", {header: header});
});

router.post("/forgot", function(req, res, next){
    async.waterfall([
        function(done) {
            crypto.randomBytes(20, function(err, buf) {
                let token = buf.toString('hex');
                done(err, token);
            });
        },
        function(token, done){
            User.findOne({ email: req.body.email }, function(err, user){
                if(!user){
                    req.flash('error', 'Nie znaleźliśmy konta z takim emailem. Spróbuj ponownie');
                    return res.redirect("/forgot");
                }
                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 360000;
                user.save(function(err){
                    done(err, token, user);
                });
            });
        },
        function(token, user, done) {
            const mailgun = require("mailgun-js");
			const DOMAIN = 'websiteswithpassion.pl';
			const mg = mailgun({apiKey: process.env.API_KEY, domain: DOMAIN, host:"api.eu.mailgun.net"});
			const data = {
				from: 'Websites With Passion <admin@websiteswithpassion.pl>',
                to: user.email,
                subject: "Resetowanie hasła na stronie Czester Garage",
                text: 'Otrzymujesz ten email, ponieważ ty (albo ktoś inny) zażądał zmianę hasła na stronie Czester Garage. \n\n' + 
                    'Prosimy kliknij w poniższy link albo skopiuj go do paska przeglądarki, by dokończyć ten proces: \n\n' +
                    'http://' + req.headers.host + '/reset/' + token + '\n\n' + 
                    'Jeśli to nie ty zażądałeś zmiany, prosimy zignoruj ten email, a twoje hasło nie zostanie zmienione. \n'
			};
			mg.messages().send(data, function (error, body) {
				req.flash("success", "Email został wysłany na adres " + user.email + " z dalszymi instrukcjami");
				console.log(error);
                done(error);
			});
            
        }
    ], function(err){
        if(err) return next(err);
        res.redirect('/forgot');
    });
});

router.get("/reset/:token", function(req, res){
    User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() }}, function(err, user){
        if(!user) {
            req.flash("error", "Token wygasł lub jest niepoprawny");
            return res.redirect("/forgot");
        }
        let header = `Resetuj hasło | Czester Garage`;
        res.render("reset", { token: req.params.token, header: header });
    });
});

router.post("/reset/:token", function(req, res){
    async.waterfall([
        function(done) {
            User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user){
                if(!user){
                    req.flash("error", "Token wygasł lub jest niepoprawny");
                    return res.redirect("back");
                }
                if(req.body.password === req.body.confirm){
                    user.setPassword(req.body.password, function(err){
                        user.resetPasswordExpires = undefined;
                        user.resetPasswordToken = undefined;
                        user.save(function(err){
                            req.logIn(user, function(err){
                                done(err, user);
                            });
                        });
                    });
                } else {
                    req.flash("error", "Hasła nie pasują do siebie");
                    return res.redirect("back");
                }
            });
        },
        function(user, done){
			const mailgun = require("mailgun-js");
			const DOMAIN = 'mkdportfolio.pl';
			const mg = mailgun({apiKey: process.env.API_KEY, domain: DOMAIN, host:"api.eu.mailgun.net"});
			const data = {
				from: 'Websites With Passion <admin@websiteswithpassion.pl>',
                to: user.email,
                subject: "Potwierdzenie zmiany hasła na stronie User",
                text: 'Witaj ' + user.username + ', \n\n' + 
                'To jest potwierdzenie, że twoje hasło zostało właśnie zmienione'
			};
			mg.messages().send(data, function (error, body) {
				req.flash("success", "Twoje hasło zostało zmienione pomyślnie");
				console.log(error);
                done(error);
			});
            
        }
    ], function(err){
        res.redirect("/");
    });
});

router.post("/feedback", function(req, res, next){
    async.waterfall([
        
        function(done){
            User.findOne({ username: admin_username }, function(err, user){
                if(!user){
                    req.flash('error', 'Nie znaleźliśmy konta z takim emailem. Spróbuj ponownie');
                    return res.redirect("/contact");
                }
                const mailgun = require("mailgun-js");
                const DOMAIN = 'websiteswithpassion.pl';
                const mg = mailgun({apiKey: process.env.API_KEY, domain: DOMAIN, host:"api.eu.mailgun.net"});
                const data = {
                    from: `${req.body.name} <${req.body.from}>`,
                    to: user.email,
                    subject: req.body.topic,
                    text: req.body.text
                };
                mg.messages().send(data, function (error, body) {
                    req.flash("success", "Pomyślnie wysłano do nas maila");
                    done(error);
                    res.redirect('/contact');
                });
            });
        }
    ], function(err){
        if(err) return next(err);
    });
});


module.exports = router;