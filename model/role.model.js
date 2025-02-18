const mongoose = require("mongoose");

const roleSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
    }
});
//
const Role = mongoose.model("Role", roleSchema);
//
module.exports = Role;