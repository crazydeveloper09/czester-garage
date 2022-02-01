const mongoose = require("mongoose");

const subcategorySchema = new mongoose.Schema({
    name: String,
    price: Number
})

module.exports = mongoose.model("Subcategory", subcategorySchema)