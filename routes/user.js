const express       = require("express"),
    User          = require("../models/user"),
    flash           = require("connect-flash"),
    methodOverride  = require("method-override"),
    Picture         = require("../models/picture"),
    sanitizeHTML    = require("sanitize-html"),
    app             = express(), 
    NodeGeocoder    = require("node-geocoder"),
    router          = express.Router(),
    multer 				= require("multer");

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

require("dotenv").config()
let options = {
    provider: 'google',
    httpAdapter: 'https',
    apiKey: process.env.GEOCODER_API_KEY,
    formatter: null
  };
let geocoder = NodeGeocoder(options);


router.get("/:id/edit", isLoggedIn, (req, res) => {
    User.findById(req.params.id, (err, user) => {
        if(err){
            console.log(err);
        } else {
            let header = `Edytuj użytkownika ${user.username} | Czester Garage`;
            res.render("./users/edit", {user:user, header: header, currentUser: req.user});
            
            
        }
    })
});

router.put("/:id", isLoggedIn, (req, res) => {
    
    geocoder.geocode(req.body.user.location, (err, data) => {
        if (err || !data.length) {
          req.flash('error', 'Invalid address');
          return res.redirect('back');
        }
        console.log(data);
        User.findByIdAndUpdate(req.params.id, req.body.user, (err, updatedUser) => {
            if(err){
                console.log(err)
            } else {
                
                let street = data[0].streetName + " " + data[0].streetNumber;
                console.log(street)
                updatedUser.location = data[0].formattedAddress;
                updatedUser.lat = data[0].latitude;
                updatedUser.lng = data[0].longitude;
                updatedUser.postCode = data[0].zipcode;
                updatedUser.city =  data[0].city;
                updatedUser.street = street;
                updatedUser.description = sanitizeHTML(req.body.user.description);
                updatedUser.save();
                res.redirect("/")
            }
        })
    });
    
})

router.get("/:id/new/picture", isLoggedIn, function(req, res){
    User.findById(req.params.id, function(err, user){
		if(err) {
			console.log(err);
		} else {
			let header = `Dodaj zdjęcie do galerii ${user.username} | Czester Garage`;
			res.render("./users/addP", {user: user, header: header});
            
			
		}
	});
	
});

router.post("/:id/new/picture", upload.single('picture'), function(req, res){
	cloudinary.uploader.upload(req.file.path, function(result) {
		User.findById(req.params.id, function(err, user){
			if(err) {
				console.log(err);
			} else {
                Picture.create({source: result.secure_url}, (err, createdPicture) => {
                    user.pictures.push(createdPicture);
                    user.save();
                    res.redirect("/");
                })
				
			}
		});
	});
	
});


function isLoggedIn (req, res, next) {
    if(req.isAuthenticated()) {
        return next();
    }
    req.flash("error", "Nie masz dostępu do tej strony");
    res.redirect(`/?return_route=${req._parsedOriginalUrl.path}`);
}

module.exports = router;