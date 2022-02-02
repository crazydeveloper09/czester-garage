const mongoose = require("mongoose");

const subcategorySchema = new mongoose.Schema({
    name: String,
    price: String
})

module.exports = mongoose.model("Subcategory", subcategorySchema)