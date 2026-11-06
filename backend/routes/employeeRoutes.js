
const express = require("express");
const router = express.Router();

const Employee = require("../models/Employee");

function normalizeEmployeePayload(body = {}) {
    const fullName = (body.fullName || body.name || "").trim();
    const dateOfJoining = body.dateOfJoining || body.joiningDate || body.joinDateISO || null;
    const dateOfBirth = body.dateOfBirth || body.dob || null;
    const statusValue = String(body.status || "Active").trim().toLowerCase();

    return {
        ...body,
        employeeId: String(body.employeeId || "").trim(),
        fullName,
        name: body.name || fullName,
        email: String(body.email || "").trim().toLowerCase(),
        phone: String(body.phone || "").trim(),
        department: String(body.department || "").trim(),
        designation: String(body.designation || body.role || "").trim(),
        dateOfBirth: dateOfBirth || undefined,
        dateOfJoining: dateOfJoining || undefined,
        status: statusValue === "inactive" ? "Inactive" : "Active"
    };
}

function duplicateEmployeeMessage(error) {
    if (!error || error.code !== 11000) return null;
    const field = Object.keys(error.keyPattern || {})[0] || "";
    if (field === "employeeId") return "Employee ID already exists.";
    if (field === "email") return "Email already exists.";
    return "Employee ID or Email already exists.";
}

function validateEmployeePayload(payload, { isUpdate = false } = {}) {
    const errors = {};
    if (!payload.employeeId) errors.employeeId = "Employee ID is required.";
    if (!payload.fullName) errors.fullName = "Full name is required.";
    if (!payload.email) errors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) errors.email = "Enter a valid email address.";
    if (!payload.phone) errors.phone = "Phone number is required.";
    if (!payload.department) errors.department = "Department is required.";
    if (!payload.designation) errors.designation = "Designation is required.";
    if (!payload.dateOfBirth) errors.dateOfBirth = "Date of birth is required.";
    if (!payload.dateOfJoining) errors.dateOfJoining = "Date of joining is required.";
    return errors;
}

// 1. Add Employee
router.post("/add", async (req, res) => {
    try {
        const payload = normalizeEmployeePayload(req.body);
        const validationErrors = validateEmployeePayload(payload);
        if (Object.keys(validationErrors).length) {
            return res.status(400).json({ success: false, message: "Please correct the highlighted fields.", errors: validationErrors });
        }
        const employee = new Employee(payload);

        await employee.save();

        res.status(201).json({
            success: true,
            message: "Employee added successfully!",
            employee
        });

    } catch (error) {
        const duplicateMessage = duplicateEmployeeMessage(error);
        if (duplicateMessage) return res.status(409).json({ success: false, message: duplicateMessage });
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// 2. Get All Employees
router.get("/", async (req, res) => {
    try {
        const { search = "", department = "", status = "" } = req.query;
        const query = {};
        if (search.trim()) {
            const term = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
            query.$or = [{ fullName: term }, { name: term }, { email: term }, { employeeId: term }];
        }
        if (department) query.department = new RegExp(`^${department.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
        if (status) {
            const normalizedStatus = status.toLowerCase() === "inactive" ? ["Inactive", "inactive"] : ["Active", "active"];
            query.status = { $in: normalizedStatus };
        }
        const employees = await Employee.find(query).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            employees
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 3. Get Single Employee
router.get("/:id", async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: "Employee not found"
            });
        }

        res.status(200).json({
            success: true,
            employee
        });

    } catch (error) {
        if (error && error.code === 11000) {
            const field = Object.keys(error.keyPattern || {})[0] || "value";
            return res.status(400).json({
                success: false,
                message: field === "employeeId" ? "Employee ID already exists." : "Email already exists."
            });
        }
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// 4. Update Employee
router.put("/:id", async (req, res) => {
    try {
        const payload = normalizeEmployeePayload(req.body);
        const validationErrors = validateEmployeePayload(payload, { isUpdate: true });
        if (Object.keys(validationErrors).length) {
            return res.status(400).json({ success: false, message: "Please correct the highlighted fields.", errors: validationErrors });
        }
        const employee = await Employee.findByIdAndUpdate(
            req.params.id,
            payload,
            {
                new: true,
                runValidators: true
            }
        );

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: "Employee not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Employee updated successfully!",
            employee
        });

    } catch (error) {
        const duplicateMessage = duplicateEmployeeMessage(error);
        if (duplicateMessage) return res.status(409).json({ success: false, message: duplicateMessage });
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// 5. Delete Employee
router.delete("/:id", async (req, res) => {
    try {
        const employee = await Employee.findByIdAndDelete(req.params.id);

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: "Employee not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Employee deleted successfully!"
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
