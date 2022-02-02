const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema({
    title: String,
    profile: String,
    description: String,
    time: String,
    price: String,
    pictures: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Picture"
        }
    ],
    whyHere: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "WhyHere"
        }
    ],
    subcategories: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Subcategory"
        }
    ],
    subpageLink: String,
    chosen: {
        type: Boolean,
        default: false
    }
})

module.exports = mongoose.model("Service", serviceSchema)