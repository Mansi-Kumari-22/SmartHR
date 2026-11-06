
const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
    {
        employeeId: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        fullName: {
            type: String,
            trim: true
        },

        name: { type: String, trim: true },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        phone: { type: String, required: true, trim: true },

        department: {
            type: String,
            required: true
        },

        designation: {
            type: String,
            required: true
        },

        dateOfBirth: {
            type: Date,
            required: true
        },

        dateOfJoining: {
            type: Date,
            required: false
        },

        joiningDate: {
            type: Date,
            required: false
        },

        role: {
            type: String,
            enum: ["HR", "Manager", "Employee"],
            default: "Employee"
        },

        status: {
            type: String,
            enum: ["Active", "Inactive", "active", "inactive"],
            default: "Active"
        }
    },
    {
        timestamps: true
    }
);

const Employee = mongoose.model("Employee", employeeSchema);

module.exports = Employee;
