const mongoose = require("mongoose"),
    passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    lat: Number,
    lng: Number,
    email: String,
    location: String,
    companyName: String,
    phone: String,
    facebookLink: String,
    about: String,
    city: String,
    postCode: String,
    street: String,
    profiAutoPhone: String,
    description: String,
    pictures: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Picture"
        }
    ],
    resetPasswordToken: String,
	resetPasswordExpires: Date
})

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema)