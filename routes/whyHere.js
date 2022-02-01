const express = require("express"),
    WhyHere = require("../models/whyHere"),
    Service = require("../models/service"),
    methodOverride = require("method-override"),
    sanitizeHTML    = require("sanitize-html"),
    app = express(),
    flash = require("connect-flash"),
    router = express.Router({mergeParams: true});
app.use(flash());
app.use(methodOverride("_method"));

router.get("/redirect", isLoggedIn, (req, res) => {
    Service.findById(req.params.service_id, (err, service) => {
        if(err){
            console.log(err)
        } else {
            let header = `Redirect page | Powody dlaczego tutaj | ${service.title} | Czester Garage`;
            res.render("./whyHere/redirect", {header: header, serviceSubpage:"",service: service, currentUser: req.user})
            
           
        }
    })
})

router.get("/add", isLoggedIn, (req, res) => {
    Service.findById(req.params.service_id, (err, service) => {
        if(err){
            console.log(err)
        } else {
            
            let header = `Dodaj powód dlaczego tutaj | ${service.title} | Czester Garage`;
            res.render("./whyHere/new", {header: header, service: service})
            
            
        }
    })
})

router.post("/", isLoggedIn, (req, res) => {
    Service.findById(req.params.service_id, (err, service) => {
        if(err){
            console.log(err)
        } else {
            WhyHere.create({text: sanitizeHTML(req.body.text)}, (err, createdwhyHere) => {
                if(err) {
                   console.log(err);
                } else {
                    service.whyHere.push(createdwhyHere);
                    service.save();
                    res.redirect(`/services/${service._id}/whyHere/redirect`);
                }
           })
        }
    })
})


router.get("/:whyHere_id/edit", isLoggedIn, (req, res) => {
    Service.findById(req.params.service_id, (err, service) => {
        if(err) {
            console.log(err)
        } else {
            WhyHere.findById(req.params.whyHere_id, (err, whyHere) => {
                if(err){
                    console.log(err)
                } else {
                    
                    let header = `Edytuj powód dlaczego tutaj | ${service.title} | Czester Garage`;
                    res.render("./whyHere/edit", {header: header, service: service, whyHere:whyHere})
                    
                    
                }
            })
        }
    });
   
});

router.put("/:whyHere_id", isLoggedIn, (req, res) => {
    Service.findById(req.params.service_id, (err, service) => {
        if(err) {
            console.log(err)
        } else {
            WhyHere.findByIdAndUpdate(req.params.whyHere_id, req.body.whyHere, (err, updatedwhyHere) => {
                if(err){
                    console.log(err);
                } else {
                    updatedwhyHere.text = sanitizeHTML(req.body.whyHere.text);
                    updatedwhyHere.save();
                    res.redirect(`/services/${service.subpageLink}`);
                }
            })
        }
    })
  
});

router.get("/:whyHere_id/delete", isLoggedIn, (req, res) => {
    Service.findById(req.params.service_id, (err, service) => {
        if(err) {
            console.log(err)
        } else {
            WhyHere.findByIdAndRemove(req.params.whyHere_id, (err, updatedwhyHere) => {
                if(err){
                    console.log(err);
                } else {
                    res.redirect(`/services/${service.subpageLink}`);
                }
            })
        }
    })
  
})

function isLoggedIn(req, res, next) {
    if(req.isAuthenticated()) {
        return next();
    }
    req.flash("error", "Nie masz dostępu do tej strony");
    res.redirect(`/?return_route=${req._parsedOriginalUrl.path}`);
}

module.exports = router;