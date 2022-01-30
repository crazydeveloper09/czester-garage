const express = require("express"),
    Service = require("../models/service"),
	Picture = require("../models/picture"),
	whyHere = require("../models/whyHere"),
    flash = require("connect-flash"),
	sanitizeHTML    = require("sanitize-html"),
    methodOverride = require("method-override"),
    app = express(),
    router = express.Router(),
    multer 				= require("multer"),
    dotenv 				= require("dotenv");
    dotenv.config();

var storage = multer.diskStorage({
    filename: function(req, file, callback) {
        callback(null, Date.now() + file.originalname);
    }
});
var imageFilter = function (req, file, cb) {
// accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'syberiancats', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

app.use(flash());
app.use(methodOverride("_method"));



router.get("/new", isLoggedIn, function(req, res){
	
	let header = `Dodaj usługę | Czester Garage`;
	res.render("./services/new" , { header: header});
		
	
});
router.get("/", function(req, res){
	Service.find({}, function(err, services){
		if(err) {
			console.log(err);
		} else {
			let header = `Usługi | Czester Garage`;
			res.render("./services/index", {services:services, header: header, currentUser: req.user});
            
			
		}
	});
	
});

router.get("/:id/edit/picture", isLoggedIn, function(req, res){
   
    Service.findById(req.params.id, function(err, service){
		if(err) {
			console.log(err);
		} else {
			let header = `Edytuj zdjęcie główne ${service.title} | Usługi | Czester Garage`;
			res.render("./services/editP", {service: service, header: header});
            
			
		}
	});
});

router.get("/:id/makeChosen", isLoggedIn, (req, res) => {
	Service.findById(req.params.id, function(err, service){
		if(err) {
			console.log(err);
		} else {
			service.chosen = !service.chosen;
			service.save();
			res.redirect("back")
		}
	});
})

router.post("/:id/edit/picture", upload.single("picture"), function(req, res){
   
    cloudinary.uploader.upload(req.file.path, function(result) {
      
        Service.findById(req.params.id, function(err, service){
            if(err) {
                console.log(err);
            } else {
               service.profile = result.secure_url;
              
               service.save();
                res.redirect("/services/" +service.subpageLink);
            }
        });
    });
    
});

router.get("/:id/new/picture", isLoggedIn, function(req, res){
    Service.findById(req.params.id, function(err, service){
		if(err) {
			console.log(err);
		} else {
			let header = `Dodaj zdjęcie do galerii ${service.title} | Usługi | Czester Garage`;
			res.render("./services/addP", {service: service, header: header});
            
			
		}
	});
	
});

router.post("/:id/new/picture", upload.single('picture'), function(req, res){
	cloudinary.uploader.upload(req.file.path, function(result) {
		Service.findById(req.params.id, function(err, service){
			if(err) {
				console.log(err);
			} else {
                Picture.create({source: result.secure_url}, (err, createdPicture) => {
                    service.pictures.push(createdPicture);
                    service.save();
                    res.redirect("/services/" +service.subpageLink);
                })
				
			}
		});
	});
	
});


router.post("/", upload.single('profile'), function(req, res){
	if(typeof req.file !== 'undefined'){
		cloudinary.uploader.upload(req.file.path, function(result) {
			let newService = new Service({
				title:req.body.title,
				profile: result.secure_url,
                time: req.body.time,
                price: req.body.price,
				description: sanitizeHTML(req.body.description),
				pictures: [],
				whyHere: [],
				subpageLink: req.body.title.toLowerCase().split(' ').join('-')
			});
			Service.create(newService, function(err, createdservice) {
				if(err) {
					console.log(err);
				} else {
					res.redirect("/services");
				}
			})
		});
	} else {
	
			let newService = new Service({
				title:req.body.title,
				description: sanitizeHTML(req.body.description),
                time: req.body.time,
                price: req.body.price,
				pictures: [],
				whyHere: [],
				subpageLink: req.body.title.toLowerCase().split(' ').join('-')
			});
			Service.create(newService, function(err, createdservice) {
				if(err) {
					console.log(err);
				} else {
					res.redirect("/services");
				}
			})
		
	}
	
	
});


router.get("/:id/edit", isLoggedIn, function(req, res){
	Service.findOne({_id:req.params.id}, function(err, service){
		if(err) {
			console.log(err);
		} else {
			let header = `Edytuj ${service.title} | Usługi | Czester Garage`;
			res.render("./services/edit", {service: service, header: header});
            
			
		}
	});
	
});

router.get("/:id", function(req, res){
	Service.findOne({subpageLink:req.params.id}).populate(["whyHere","pictures"]).exec(function(err, service){
		if(err) {
			console.log(err);
		} else {
			let header = `${service.title} | Usługi | Czester Garage`;
			res.render("./services/show", {service: service, header: header, currentUser: req.user});
            
			
		}
	});
});

router.put("/:id", isLoggedIn, function(req, res){
	Service.findByIdAndUpdate(req.params.id, req.body.service, function(err, updatedservice){
		if(err) {
			console.log(err);
		} else {
			updatedservice.subpageLink = updatedservice.title.toLowerCase().split(' ').join('-');
			updatedservice.description = sanitizeHTML(req.body.service.description);
			updatedservice.save();
			res.redirect("/services/" + updatedservice.subpageLink);
		}
	});
});

router.get("/:id/delete", isLoggedIn, function(req, res){
	Service.findByIdAndDelete(req.params.id, function(err, deletedservice){
		if(err) {
			console.log(err);
		} else {
			res.redirect("/services");
		}
	});
});




function isLoggedIn (req, res, next) {
    if(req.isAuthenticated()) {
        return next();
    }
    req.flash("error", "Nie masz dostępu do tej strony");
    res.redirect(`/?return_route=${req._parsedOriginalUrl.path}`);
}

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;