const mongoose = require("mongoose");

const birthdayEmailLogSchema = new mongoose.Schema({
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null },
    employeeName: { type: String, required: true },
    recipientEmail: { type: String, required: true },
    birthdayDate: { type: String, required: true },
    subject: { type: String, required: true },
    status: { type: String, enum: ["pending", "sent", "failed"], required: true },
    deliveryType: { type: String, enum: ["automatic", "test"], default: "automatic" },
    emailType: { type: String, enum: ["birthday", "work-anniversary"], default: "birthday" },
    milestoneYears: { type: Number, default: null },
    messageId: { type: String },
    error: { type: String }
}, { timestamps: true });

birthdayEmailLogSchema.index(
    { employee: 1, birthdayDate: 1 },
    {
        unique: true,
        partialFilterExpression: {
            status: { $in: ["pending", "sent"] },
            deliveryType: "automatic",
            employee: { $type: "objectId" }
        }
    }
);

birthdayEmailLogSchema.index(
    { employee: 1, milestoneYears: 1 },
    {
        unique: true,
        partialFilterExpression: {
            status: { $in: ["pending", "sent"] },
            deliveryType: "automatic",
            emailType: "work-anniversary",
            employee: { $type: "objectId" }
        }
    }
);

module.exports = mongoose.model("BirthdayEmailLog", birthdayEmailLogSchema, "emailhistories");
