const express = require("express"),
    Subcategory = require("../models/subcategory"),
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
            let header = `Redirect page | Podkategorie | ${service.title} | Czester Garage`;
            res.render("./subcategories/redirect", {header: header, service: service, currentUser: req.user})
            
           
        }
    })
})

router.get("/add", isLoggedIn, (req, res) => {
    Service.findById(req.params.service_id, (err, service) => {
        if(err){
            console.log(err)
        } else {
            
            let header = `Dodaj podkategorię | ${service.title} | Czester Garage`;
            res.render("./subcategories/new", {header: header, service: service})
            
            
        }
    })
})

router.post("/", isLoggedIn, (req, res) => {
    Service.findById(req.params.service_id, (err, service) => {
        if(err){
            console.log(err)
        } else {
            Subcategory.create({name: sanitizeHTML(req.body.name), price: req.body.price}, (err, createdsubcategory) => {
                if(err) {
                   console.log(err);
                } else {
                    service.subcategories.push(createdsubcategory);
                    service.save();
                    res.redirect(`/services/${service._id}/subcategories/redirect`);
                }
           })
        }
    })
})


router.get("/:subcategory_id/edit", isLoggedIn, (req, res) => {
    Service.findById(req.params.service_id, (err, service) => {
        if(err) {
            console.log(err)
        } else {
            Subcategory.findById(req.params.subcategory_id, (err, subcategory) => {
                if(err){
                    console.log(err)
                } else {
                    
                    let header = `Edytuj podkategorię | ${service.title} | Czester Garage`;
                    res.render("./subcategories/edit", {header: header, service: service, subcategory:subcategory})
                    
                    
                }
            })
        }
    });
   
});

router.put("/:subcategory_id", isLoggedIn, (req, res) => {
    Service.findById(req.params.service_id, (err, service) => {
        if(err) {
            console.log(err)
        } else {
            Subcategory.findByIdAndUpdate(req.params.subcategory_id, req.body.subcategory, (err, updatedsubcategory) => {
                if(err){
                    console.log(err);
                } else {
                    updatedsubcategory.name = sanitizeHTML(req.body.subcategory.name);
                    updatedsubcategory.save();
                    res.redirect(`/services/${service.subpageLink}`);
                }
            })
        }
    })
  
});

router.get("/:subcategory_id/delete", isLoggedIn, (req, res) => {
    Service.findById(req.params.service_id, (err, service) => {
        if(err) {
            console.log(err)
        } else {
            Subcategory.findByIdAndRemove(req.params.subcategory_id, (err, updatedsubcategory) => {
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