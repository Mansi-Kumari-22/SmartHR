const mongoose = require("mongoose");

const birthdaySettingsSchema = new mongoose.Schema({
    subject: { type: String, default: "Happy Birthday, {employeeName}!" },
    message: {
        type: String,
        default: "Wishing you a very Happy Birthday! May your day be filled with happiness, success and wonderful memories."
    },
    enabled: { type: Boolean, default: true }
});

module.exports = mongoose.model("BirthdaySettings", birthdaySettingsSchema);
