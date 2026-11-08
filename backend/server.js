
const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env"), override: true, quiet: true });
const { getEmailProviderStatus } = require("./services/emailService");
console.log("Email provider runtime status:", getEmailProviderStatus());

const connectDB = require("./config/db");
const employeeRoutes = require("./routes/employeeRoutes");
const birthdayRoutes = require("./routes/birthdayRoutes");
const workAnniversaryRoutes = require("./routes/workAnniversaryRoutes");
const hrOperationsRoutes = require("./routes/hrOperationsRoutes");
const recruitmentRoutes = require("./routes/recruitmentRoutes");
const performanceRoutes = require("./routes/performanceRoutes");
const { startBirthdayScheduler } = require("./services/birthdayService");
const { startWorkAnniversaryScheduler } = require("./services/workAnniversaryService");

const app = express();

app.use(cors());
app.use(express.json());

// Home Route
app.get("/", (req, res) => {
    res.send("Welcome to SmartHR API!");
});

// Employee Routes
app.use("/api/employees", employeeRoutes);
app.use("/api/birthday", birthdayRoutes);
app.use("/api/work-anniversary", workAnniversaryRoutes);
app.use("/api/hr", hrOperationsRoutes);
app.use("/api/recruitment", recruitmentRoutes);
app.use("/api/performance", performanceRoutes);

// Start Server
const startServer = async () => {
    await connectDB();

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
        console.log(`SmartHR Server running on port ${PORT}`);
    });
    startBirthdayScheduler();
    startWorkAnniversaryScheduler();
};

startServer();
