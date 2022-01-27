const express = require("express"),
    User = require("../models/user"),
    router = express.Router();

let admin_username = "admin";

router.get("/user", (req, res) => {
    User.findOne({username: admin_username}).populate("pictures").exec((err, admin) => {
        if(err){
            res.json(err);
        } else {
            res.json(admin)
        }
    })
})

module.exports = router;