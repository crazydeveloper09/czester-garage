const mongoose = require("mongoose");

const whyHereSchema = new mongoose.Schema({
    text: String
})

module.exports = mongoose.model("WhyHere", whyHereSchema)