const express = require("express");
const mongoose = require("mongoose");
const Employee = require("../models/Employee");
const AttendanceRecord = require("../models/AttendanceRecord");
const LeaveRequest = require("../models/LeaveRequest");
const LeaveBalance = require("../models/LeaveBalance");
const SalaryStructure = require("../models/SalaryStructure");
const PayrollRecord = require("../models/PayrollRecord");

const router = express.Router();
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const monthPattern = /^\d{4}-\d{2}$/;
const validLeaveTypes = ["Casual Leave", "Sick Leave", "Earned Leave", "Unpaid Leave"];
const validStatus = ["Present", "Absent", "Late", "Remote"];

function validDate(value) {
    return typeof value === "string" && datePattern.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function validTime(value) {
    return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function durationDays(startDate, endDate) {
    const start = Date.parse(`${startDate}T00:00:00Z`);
    const end = Date.parse(`${endDate}T00:00:00Z`);
    return Math.floor((end - start) / 86400000) + 1;
}

function calculateWorkingHours(checkIn, checkOut) {
    if (!validTime(checkIn) || !validTime(checkOut)) return 0;
    const [inHour, inMinute] = checkIn.split(":").map(Number);
    const [outHour, outMinute] = checkOut.split(":").map(Number);
    const minutes = outHour * 60 + outMinute - (inHour * 60 + inMinute);
    return minutes > 0 ? Number((minutes / 60).toFixed(2)) : 0;
}

async function findEmployee(employeeId) {
    if (!mongoose.isValidObjectId(employeeId)) return null;
    return Employee.findById(employeeId);
}

router.get("/attendance", async (req, res) => {
    try {
        const { search = "", employeeId = "", date = "", from = "", to = "", status = "" } = req.query;
        const query = {};
        if (employeeId && mongoose.isValidObjectId(employeeId)) query.employee = employeeId;
        if (date) query.date = date;
        if (from && to) query.date = { $gte: from, $lte: to };
        else if (from) query.date = { $gte: from };
        else if (to) query.date = { $lte: to };
        if (status && validStatus.includes(status)) query.status = status;

        let records = await AttendanceRecord.find(query).populate("employee", "fullName name email employeeId department").sort({ date: -1, createdAt: -1 });
        if (search.trim()) {
            const term = search.trim().toLowerCase();
            records = records.filter((record) => String(record.employee?.fullName || record.employee?.name || "").toLowerCase().includes(term) ||
                String(record.employee?.employeeId || "").toLowerCase().includes(term) ||
                String(record.employee?.email || "").toLowerCase().includes(term));
        }
        const summary = {
            present: records.filter((record) => record.status === "Present").length,
            absent: records.filter((record) => record.status === "Absent").length,
            late: records.filter((record) => record.status === "Late").length,
            remote: records.filter((record) => record.status === "Remote").length
        };
        res.json({ success: true, records, summary });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post("/attendance", async (req, res) => {
    try {
        const { employeeId, date, checkIn = "", checkOut = "", status, notes = "" } = req.body;
        const employee = await findEmployee(employeeId);
        if (!employee) return res.status(400).json({ success: false, message: "Select a valid employee." });
        if (!validDate(date)) return res.status(400).json({ success: false, message: "Select a valid attendance date." });
        if (!validStatus.includes(status)) return res.status(400).json({ success: false, message: "Select a valid attendance status." });
        if (checkIn && !validTime(checkIn)) return res.status(400).json({ success: false, message: "Enter a valid check-in time." });
        if (checkOut && !validTime(checkOut)) return res.status(400).json({ success: false, message: "Enter a valid check-out time." });
        if (checkIn && checkOut && calculateWorkingHours(checkIn, checkOut) === 0) {
            return res.status(400).json({ success: false, message: "Check-out must be after check-in." });
        }
        const duplicate = await AttendanceRecord.findOne({ employee: employee._id, date });
        if (duplicate) return res.status(409).json({ success: false, message: "Attendance for this employee and date already exists." });
        const record = await AttendanceRecord.create({
            employee: employee._id, date, checkIn, checkOut, status, notes,
            workingHours: calculateWorkingHours(checkIn, checkOut)
        });
        res.status(201).json({ success: true, message: "Attendance saved successfully.", record: await record.populate("employee", "fullName name email employeeId department") });
    } catch (error) {
        if (error?.code === 11000) return res.status(409).json({ success: false, message: "Attendance for this employee and date already exists." });
        res.status(400).json({ success: false, message: error.message });
    }
});

router.put("/attendance/:id", async (req, res) => {
    try {
        const { date, checkIn = "", checkOut = "", status, notes = "" } = req.body;
        if (!validDate(date)) return res.status(400).json({ success: false, message: "Select a valid attendance date." });
        if (!validStatus.includes(status)) return res.status(400).json({ success: false, message: "Select a valid attendance status." });
        if (checkIn && !validTime(checkIn)) return res.status(400).json({ success: false, message: "Enter a valid check-in time." });
        if (checkOut && !validTime(checkOut)) return res.status(400).json({ success: false, message: "Enter a valid check-out time." });
        if (checkIn && checkOut && calculateWorkingHours(checkIn, checkOut) === 0) return res.status(400).json({ success: false, message: "Check-out must be after check-in." });
        const current = await AttendanceRecord.findById(req.params.id);
        if (!current) return res.status(404).json({ success: false, message: "Attendance record not found." });
        const duplicate = await AttendanceRecord.findOne({ _id: { $ne: current._id }, employee: current.employee, date });
        if (duplicate) return res.status(409).json({ success: false, message: "Attendance for this employee and date already exists." });
        current.date = date;
        current.checkIn = checkIn;
        current.checkOut = checkOut;
        current.status = status;
        current.notes = notes;
        current.workingHours = calculateWorkingHours(checkIn, checkOut);
        await current.save();
        res.json({ success: true, message: "Attendance updated successfully.", record: await current.populate("employee", "fullName name email employeeId department") });
    } catch (error) {
        if (error?.code === 11000) return res.status(409).json({ success: false, message: "Attendance for this employee and date already exists." });
        res.status(400).json({ success: false, message: error.message });
    }
});

router.get("/leave", async (req, res) => {
    try {
        const { search = "", employeeId = "", leaveType = "", status = "" } = req.query;
        const query = {};
        if (employeeId && mongoose.isValidObjectId(employeeId)) query.employee = employeeId;
        if (leaveType && validLeaveTypes.includes(leaveType)) query.leaveType = leaveType;
        if (status && ["Pending", "Approved", "Rejected"].includes(status)) query.status = status;
        let records = await LeaveRequest.find(query).populate("employee", "fullName name email employeeId department").sort({ createdAt: -1 });
        if (search.trim()) {
            const term = search.trim().toLowerCase();
            records = records.filter((record) => String(record.employee?.fullName || record.employee?.name || "").toLowerCase().includes(term) ||
                String(record.employee?.employeeId || "").toLowerCase().includes(term));
        }
        const currentMonthPrefix = new Date().toISOString().slice(0, 7);
        const allLeaveRequests = await LeaveRequest.find({});
        const summary = {
            pending: allLeaveRequests.filter((record) => record.status === "Pending").length,
            approvedThisMonth: allLeaveRequests.filter((record) => record.status === "Approved" && record.createdAt.toISOString().slice(0, 7) === currentMonthPrefix).length,
            rejected: allLeaveRequests.filter((record) => record.status === "Rejected").length
        };
        const balanceResult = await LeaveBalance.aggregate([
            { $match: { year: new Date().getFullYear() } },
            { $group: { _id: null, total: { $sum: "$availableDays" } } }
        ]);
        summary.availableDays = balanceResult[0]?.total || 0;
        res.json({ success: true, records, summary });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post("/leave", async (req, res) => {
    try {
        const { employeeId, leaveType, startDate, endDate, reason = "" } = req.body;
        const employee = await findEmployee(employeeId);
        if (!employee) return res.status(400).json({ success: false, message: "Select a valid employee." });
        if (!validLeaveTypes.includes(leaveType)) return res.status(400).json({ success: false, message: "Select a valid leave type." });
        if (!validDate(startDate) || !validDate(endDate)) return res.status(400).json({ success: false, message: "Enter valid start and end dates." });
        const duration = durationDays(startDate, endDate);
        if (duration < 1) return res.status(400).json({ success: false, message: "End date must be on or after start date." });
        if (!reason.trim()) return res.status(400).json({ success: false, message: "Leave reason is required." });
        const overlap = await LeaveRequest.findOne({
            employee: employee._id,
            status: { $in: ["Pending", "Approved"] },
            startDate: { $lte: endDate },
            endDate: { $gte: startDate }
        });
        if (overlap) return res.status(409).json({ success: false, message: "This employee already has a pending or approved leave request overlapping these dates." });
        const request = await LeaveRequest.create({ employee: employee._id, leaveType, startDate, endDate, durationDays: duration, reason: reason.trim() });
        res.status(201).json({ success: true, message: "Leave request submitted.", request: await request.populate("employee", "fullName name email employeeId department") });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.patch("/leave/:id/review", async (req, res) => {
    try {
        const { status, reviewNote = "" } = req.body;
        if (!["Approved", "Rejected"].includes(status)) return res.status(400).json({ success: false, message: "Review status must be Approved or Rejected." });
        const request = await LeaveRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ success: false, message: "Leave request not found." });
        if (request.status !== "Pending") return res.status(409).json({ success: false, message: "This leave request has already been reviewed." });
        if (status === "Approved") {
            const year = Number(request.startDate.slice(0, 4));
            const balance = await LeaveBalance.findOne({ employee: request.employee, leaveType: request.leaveType, year });
            if (!balance || balance.availableDays < request.durationDays) {
                return res.status(400).json({ success: false, message: "Approval failed: configured leave balance is insufficient or not available." });
            }
            balance.availableDays -= request.durationDays;
            await balance.save();
        }
        request.status = status;
        request.reviewedAt = new Date();
        request.reviewNote = String(reviewNote).trim();
        await request.save();
        res.json({ success: true, message: `Leave request ${status.toLowerCase()}.`, request: await request.populate("employee", "fullName name email employeeId department") });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.get("/leave/balances/:employeeId", async (req, res) => {
    try {
        const employee = await findEmployee(req.params.employeeId);
        if (!employee) return res.status(404).json({ success: false, message: "Employee not found." });
        const year = new Date().getFullYear();
        const balances = await LeaveBalance.find({ employee: employee._id, year }).sort({ leaveType: 1 });
        res.json({ success: true, year, balances });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put("/leave/balances/:employeeId", async (req, res) => {
    try {
        const employee = await findEmployee(req.params.employeeId);
        if (!employee) return res.status(404).json({ success: false, message: "Employee not found." });
        const year = Number(req.body.year || new Date().getFullYear());
        const entries = Array.isArray(req.body.balances) ? req.body.balances : [];
        if (!Number.isInteger(year) || year < 2000 || year > 2100) return res.status(400).json({ success: false, message: "Enter a valid balance year." });
        for (const entry of entries) {
            if (!validLeaveTypes.includes(entry.leaveType) || !Number.isFinite(Number(entry.availableDays)) || Number(entry.availableDays) < 0) {
                return res.status(400).json({ success: false, message: "Enter valid leave types and non-negative balances." });
            }
            await LeaveBalance.findOneAndUpdate(
                { employee: employee._id, leaveType: entry.leaveType, year },
                { employee: employee._id, leaveType: entry.leaveType, year, availableDays: Number(entry.availableDays) },
                { upsert: true, new: true, runValidators: true }
            );
        }
        res.json({ success: true, message: "Leave balances updated." });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.get("/salary/:employeeId", async (req, res) => {
    try {
        const employee = await findEmployee(req.params.employeeId);
        if (!employee) return res.status(404).json({ success: false, message: "Employee not found." });
        const salary = await SalaryStructure.findOne({ employee: employee._id });
        res.json({ success: true, salary: salary || null });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put("/salary/:employeeId", async (req, res) => {
    try {
        const employee = await findEmployee(req.params.employeeId);
        if (!employee) return res.status(404).json({ success: false, message: "Employee not found." });
        const basicSalary = Number(req.body.basicSalary);
        const allowances = Number(req.body.allowances || 0);
        const deductions = Number(req.body.deductions || 0);
        if (!Number.isFinite(basicSalary) || basicSalary < 0 || !Number.isFinite(allowances) || allowances < 0 || !Number.isFinite(deductions) || deductions < 0) {
            return res.status(400).json({ success: false, message: "Salary, allowances and deductions must be non-negative numbers." });
        }
        const salary = await SalaryStructure.findOneAndUpdate(
            { employee: employee._id },
            { employee: employee._id, basicSalary, allowances, deductions },
            { upsert: true, new: true, runValidators: true }
        );
        res.json({ success: true, message: "Salary structure saved.", salary });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.get("/payroll", async (req, res) => {
    try {
        const { search = "", employeeId = "", payPeriod = "", status = "" } = req.query;
        const query = {};
        if (employeeId && mongoose.isValidObjectId(employeeId)) query.employee = employeeId;
        if (payPeriod) query.payPeriod = payPeriod;
        if (status && ["Draft", "Processed", "Paid"].includes(status)) query.status = status;
        let records = await PayrollRecord.find(query).populate("employee", "fullName name email employeeId department").sort({ payPeriod: -1, createdAt: -1 });
        if (search.trim()) {
            const term = search.trim().toLowerCase();
            records = records.filter((record) => String(record.employee?.fullName || record.employee?.name || "").toLowerCase().includes(term) ||
                String(record.employee?.employeeId || "").toLowerCase().includes(term));
        }
        res.json({ success: true, records });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post("/payroll/preview", async (req, res) => {
    try {
        const employeeIds = Array.isArray(req.body.employeeIds) ? req.body.employeeIds.filter((id) => mongoose.isValidObjectId(id)) : [];
        const { payPeriod } = req.body;
        if (!monthPattern.test(payPeriod || "")) return res.status(400).json({ success: false, message: "Select a valid payroll month." });
        if (!employeeIds.length) return res.status(400).json({ success: false, message: "Select at least one employee." });
        const employees = await Employee.find({ _id: { $in: employeeIds } });
        const previews = [];
        for (const employee of employees) {
            const salary = await SalaryStructure.findOne({ employee: employee._id });
            if (!salary) {
                previews.push({ employeeId: employee._id, employeeName: employee.fullName || employee.name, configured: false });
                continue;
            }
            const basicSalary = salary.basicSalary;
            const allowances = salary.allowances;
            const deductions = salary.deductions;
            previews.push({
                employeeId: employee._id,
                employeeName: employee.fullName || employee.name,
                configured: true,
                basicSalary,
                allowances,
                deductions,
                grossSalary: basicSalary + allowances,
                netSalary: Math.max(0, basicSalary + allowances - deductions)
            });
        }
        res.json({ success: true, previews });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.post("/payroll/confirm", async (req, res) => {
    try {
        const { payPeriod, previews } = req.body;
        if (!monthPattern.test(payPeriod || "")) return res.status(400).json({ success: false, message: "Select a valid payroll month." });
        if (!Array.isArray(previews) || !previews.length) return res.status(400).json({ success: false, message: "Provide payroll preview records to confirm." });
        let created = 0;
        let skipped = 0;
        for (const preview of previews) {
            if (!preview.configured || !mongoose.isValidObjectId(preview.employeeId)) continue;
            const duplicate = await PayrollRecord.findOne({ employee: preview.employeeId, payPeriod });
            if (duplicate) {
                skipped += 1;
                continue;
            }
            const salary = await SalaryStructure.findOne({ employee: preview.employeeId });
            if (!salary) continue;
            const basicSalary = salary.basicSalary;
            const allowances = salary.allowances;
            const deductions = salary.deductions;
            const grossSalary = basicSalary + allowances;
            const netSalary = Math.max(0, grossSalary - deductions);
            await PayrollRecord.create({
                employee: preview.employeeId,
                payPeriod,
                basicSalary,
                allowances,
                deductions,
                grossSalary,
                netSalary,
                status: "Processed"
            });
            created += 1;
        }
        res.status(created ? 201 : 200).json({
            success: true,
            message: created ? `${created} payroll record(s) saved.${skipped ? ` ${skipped} duplicate record(s) skipped.` : ""}` : "No new payroll records were created; duplicate records were skipped.",
            created,
            skipped
        });
    } catch (error) {
        if (error?.code === 11000) return res.status(409).json({ success: false, message: "A duplicate payroll record exists for an employee and pay period." });
        res.status(400).json({ success: false, message: error.message });
    }
});

router.patch("/payroll/:id/status", async (req, res) => {
    try {
        const { status, confirmPaid = false } = req.body;
        if (!["Draft", "Processed", "Paid"].includes(status)) return res.status(400).json({ success: false, message: "Select a valid payroll status." });
        if (status === "Paid" && confirmPaid !== true) return res.status(400).json({ success: false, message: "Explicit confirmation is required to mark payroll as Paid." });
        const record = await PayrollRecord.findById(req.params.id);
        if (!record) return res.status(404).json({ success: false, message: "Payroll record not found." });
        if (record.status === "Paid") return res.status(409).json({ success: false, message: "Payroll is already marked as Paid." });
        record.status = status;
        await record.save();
        res.json({ success: true, message: status === "Paid" ? "Payroll marked as Paid after confirmation." : `Payroll status changed to ${status}.`, record });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

module.exports = router;
