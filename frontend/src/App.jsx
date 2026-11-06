import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

const API_URL = "https://smarthr-production-e7bf.up.railway.app/api";
const employeesSeed = [];

const navItems = [
  ["Dashboard", "▦"],
  ["Employee Management", "♙"],
  ["Attendance Management", "◷"],
  ["Leave Management", "▤"],
  ["Payroll Management", "◉"],
  ["Recruitment Management", "⌕"],
  ["Performance Management", "↗"],
  ["Settings", "⚙"],
];

const attendanceData = [];
const leaveData = [];

function initials(name) {
  const safeName = String(name || "").trim();
  if (!safeName) return "NA";
  return safeName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Status({ value }) {
  const safeValue = String(value || "Unknown");
  return (
    <span
      className={`status status-${safeValue.toLowerCase().replaceAll(" ", "-")}`}
    >
      {safeValue}
    </span>
  );
}

function IconButton({ children, label, className = "", onClick }) {
  return (
    <button
      type="button"
      className={`icon-button ${className}`}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function PageHeader({ title, subtitle, action, onAction }) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {action && (
        <button className="primary-button" type="button" onClick={onAction}>
          <span>＋</span> {action}
        </button>
      )}
    </header>
  );
}

function StatCard({ label, value, change, tone, icon }) {
  return (
    <article className={`stat-card stat-${tone}`}>
      <div className="stat-icon">{icon}</div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <small>{change}</small>
      </div>
    </article>
  );
}

function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/birthday/dashboard`)
      .then((response) => response.json())
      .then((data) => {
        if (data.success) setDashboard(data.stats);
      })
      .catch(() => setDashboard(null))
      .finally(() => setLoading(false));
  }, []);

  const departments = dashboard?.departmentSummary || {};
  const birthdayLogs = dashboard?.logs || [];
  const upcoming = (dashboard?.upcomingBirthdays || []).map((employee) => ({
    ...employee,
    fullName: employee.fullName || employee.name || "Unknown employee",
  }));
  const total = dashboard?.totalEmployees || 0;
  const active = dashboard?.activeEmployees || 0;
  const todayBirthdays = dashboard?.todayBirthdays || 0;
  const upcomingWorkAnniversaries = dashboard?.upcomingWorkAnniversaries || 0;

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back! Here's what's happening today."
        action="Download Report"
      />
      <section className="stats-grid">
        <StatCard
          label="Total Employees"
          value={loading ? "..." : total}
          change={total ? `${total} employee records` : "No employees added"}
          tone="blue"
          icon="♙"
        />
        <StatCard
          label="Active Employees"
          value={loading ? "..." : active}
          change={active ? "Currently active" : "No active employees"}
          tone="green"
          icon="✓"
        />
        <StatCard
          label="Today's Birthdays"
          value={loading ? "..." : todayBirthdays}
          change={todayBirthdays ? "Celebrating today" : "No birthdays today"}
          tone="orange"
          icon="🎂"
        />
        <StatCard
          label="Upcoming Work Anniversaries"
          value={loading ? "..." : upcomingWorkAnniversaries}
          change="1st, 3rd and 5th milestones"
          tone="purple"
          icon="★"
        />
      </section>
      <section className="dashboard-grid">
        <article className="content-card overview-card">
          <div className="card-heading">
            <div>
              <h3>Workforce Overview</h3>
              <p>Employees by department</p>
            </div>
            <select defaultValue="2026">
              <option>2026</option>
              <option>2025</option>
            </select>
          </div>
          <div className="department-bars">
            {Object.entries(departments).map(([name, count], index) => (
              <div className="department-row" key={name}>
                <div className="department-label">
                  <span>{name}</span>
                  <strong>{count}</strong>
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${Math.min(100, (count / Math.max(total, 1)) * 100)}%`,
                      background: [
                        "#5365d8",
                        "#6d7ee4",
                        "#9b79d0",
                        "#e0a15b",
                        "#62a58b",
                      ][index % 5],
                    }}
                  />
                </div>
              </div>
            ))}
            {Object.keys(departments).length === 0 && (
              <div className="empty-state compact">
                <span>▥</span>
                <p>No workforce data available</p>
              </div>
            )}
          </div>
        </article>
        <article className="content-card activity-card">
          <div className="card-heading">
            <div>
              <h3>Upcoming Birthdays</h3>
              <p>Next employee birthdays</p>
            </div>
          </div>
          <div className="activity-list">
            {upcoming.slice(0, 5).map((employee) => (
              <div className="activity-item" key={employee._id}>
                <span className="activity-avatar purple">
                  {initials(employee.fullName)}
                </span>
                <div>
                  <strong>{employee.fullName}</strong>
                  <small>
                    {new Date(employee.dateOfBirth).toLocaleDateString(
                      "en-IN",
                      { month: "long", day: "numeric", timeZone: "UTC" },
                    )}
                  </small>
                </div>
              </div>
            ))}
            {upcoming.length === 0 && (
              <div className="empty-state compact">
                <span>🎂</span>
                <p>No upcoming birthdays</p>
              </div>
            )}
          </div>
        </article>
      </section>
      <section className="content-card">
        <div className="card-heading">
          <div>
            <h3>Birthday Email Activity</h3>
            <p>Recent delivery status</p>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Recipient</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {birthdayLogs.map((log) => (
                <tr key={log._id}>
                  <td>{log.employeeName}</td>
                  <td>{log.recipientEmail}</td>
                  <td>{new Date(log.createdAt).toLocaleDateString()}</td>
                  <td>
                    <Status
                      value={log.status === "sent" ? "Active" : "Inactive"}
                    />
                  </td>
                </tr>
              ))}
              {birthdayLogs.length === 0 && (
                <tr>
                  <td colSpan="4">
                    <div className="empty-state">
                      <span>✉</span>
                      <strong>No birthday email activity</strong>
                      <p>Delivery records will appear here.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function LegacyEmployeeManagement() {
  const [employees, setEmployees] = useState(employeesSeed);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All Departments");
  const [designationFilter, setDesignationFilter] =
    useState("All Designations");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState(null);
  const [deleteEmployee, setDeleteEmployee] = useState(null);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    window.clearTimeout(showNotification.timeout);
    showNotification.timeout = window.setTimeout(
      () => setNotification(null),
      3500,
    );
  };

  const filtered = useMemo(
    () =>
      employees.filter(
        (employee) =>
          `${employee.name} ${employee.email} ${employee.employeeId}`
            .toLowerCase()
            .includes(search.toLowerCase()) &&
          (departmentFilter === "All Departments" ||
            employee.department === departmentFilter) &&
          (designationFilter === "All Designations" ||
            employee.role === designationFilter),
      ),
    [employees, search, departmentFilter, designationFilter],
  );

  const designations = [
    "All Designations",
    ...new Set(employees.map((employee) => employee.role)),
  ];

  const openAdd = () => {
    const nextNumber =
      Math.max(
        ...employees.map(
          (employee) => Number(employee.employeeId.replace(/\D/g, "")) || 1000,
        ),
        1000,
      ) + 1;
    const today = new Date().toISOString().slice(0, 10);
    setForm({
      employeeId: `EMP-${nextNumber}`,
      name: "",
      email: "",
      role: "",
      department: "Engineering",
      status: "Active",
      joinDate: new Date().toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      joinDateISO: today,
      phone: "",
    });
    setErrors({});
    setModal("add");
  };
  const openEdit = (employee) => {
    const parsedDate = new Date(employee.joinDate);
    const joinDateISO = Number.isNaN(parsedDate.getTime())
      ? ""
      : parsedDate.toISOString().slice(0, 10);
    setForm({ ...employee, joinDateISO });
    setErrors({});
    setModal("edit");
  };
  const saveEmployee = (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!form.employeeId?.trim())
      nextErrors.employeeId = "Employee ID is required.";
    if (!form.name?.trim()) nextErrors.name = "Full name is required.";
    if (!form.email?.trim()) nextErrors.email = "Email address is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      nextErrors.email = "Enter a valid email address.";
    if (!form.role?.trim()) nextErrors.role = "Designation is required.";
    if (!form.department) nextErrors.department = "Department is required.";
    if (!form.joinDate?.trim())
      nextErrors.joinDate = "Joining date is required.";
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      showNotification("error", "Please correct the highlighted fields.");
      return;
    }
    const duplicateEmail = employees.some(
      (employee) =>
        employee.id !== form.id &&
        employee.email.toLowerCase() === form.email.toLowerCase(),
    );
    const duplicateId = employees.some(
      (employee) =>
        employee.id !== form.id &&
        employee.employeeId.toLowerCase() === form.employeeId.toLowerCase(),
    );
    if (duplicateEmail || duplicateId) {
      setErrors({
        ...(duplicateEmail
          ? { email: "This email is already assigned to another employee." }
          : {}),
        ...(duplicateId
          ? { employeeId: "This employee ID already exists." }
          : {}),
      });
      showNotification("error", "Employee ID or email already exists.");
      return;
    }
    if (modal === "edit") {
      setEmployees((items) =>
        items.map((item) => (item.id === form.id ? { ...form } : item)),
      );
      showNotification("success", `${form.name} was updated successfully.`);
    } else {
      setEmployees((items) => [
        { ...form, id: Math.max(...items.map((item) => item.id), 0) + 1 },
        ...items,
      ]);
      showNotification("success", `${form.name} was added successfully.`);
    }
    setModal(null);
  };

  const confirmDelete = () => {
    setEmployees((items) =>
      items.filter((employee) => employee.id !== deleteEmployee.id),
    );
    showNotification(
      "success",
      `${deleteEmployee.name} was deleted successfully.`,
    );
    setDeleteEmployee(null);
  };

  return (
    <>
      <PageHeader
        title="Employee Management"
        subtitle="Manage your workforce and employee information."
        action="Add Employee"
        onAction={openAdd}
      />
      {notification && (
        <div className={`notification-toast ${notification.type}`} role="alert">
          <span>{notification.type === "success" ? "✓" : "!"}</span>
          {notification.message}
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => setNotification(null)}
          >
            ×
          </button>
        </div>
      )}
      <section className="mini-stats">
        <div>
          <span>Total Employees</span>
          <strong>{employees.length}</strong>
        </div>
        <div>
          <span>Active</span>
          <strong>
            {employees.filter((e) => e.status === "Active").length}
          </strong>
        </div>
        <div>
          <span>On Leave</span>
          <strong>
            {employees.filter((e) => e.status === "On Leave").length}
          </strong>
        </div>
      </section>
      <section className="content-card">
        <div className="table-tools employee-tools">
          <label className="search-box">
            <span>⌕</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, email or employee ID..."
            />
          </label>
          <div className="filter-group">
            <select
              className="filter-select"
              aria-label="Filter by department"
              value={departmentFilter}
              onChange={(event) => setDepartmentFilter(event.target.value)}
            >
              <option>All Departments</option>
              <option>Design</option>
              <option>Engineering</option>
              <option>Human Resources</option>
              <option>Marketing</option>
              <option>Finance</option>
            </select>
            <select
              className="filter-select"
              aria-label="Filter by designation"
              value={designationFilter}
              onChange={(event) => setDesignationFilter(event.target.value)}
            >
              {designations.map((designation) => (
                <option key={designation}>{designation}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Employee</th>
                <th>Designation</th>
                <th>Department</th>
                <th>Join Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((employee) => (
                <tr key={employee.id}>
                  <td>
                    <strong className="employee-id">
                      {employee.employeeId}
                    </strong>
                  </td>
                  <td>
                    <span className="employee-cell">
                      <span className="table-avatar">
                        {initials(employee.name)}
                      </span>
                      <span>
                        <strong>{employee.name}</strong>
                        <small>{employee.email}</small>
                      </span>
                    </span>
                  </td>
                  <td>{employee.role}</td>
                  <td>{employee.department}</td>
                  <td>{employee.joinDate}</td>
                  <td>
                    <Status value={employee.status} />
                  </td>
                  <td>
                    <div className="action-row">
                      <IconButton
                        label="View employee"
                        onClick={() => {
                          setForm(employee);
                          setModal("view");
                        }}
                      >
                        ◉
                      </IconButton>
                      <IconButton
                        label="Edit employee"
                        onClick={() => openEdit(employee)}
                      >
                        ✎
                      </IconButton>
                      <IconButton
                        label="Delete employee"
                        className="danger"
                        onClick={() => setDeleteEmployee(employee)}
                      >
                        ⌫
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="7">
                    <div className="empty-state">
                      <span>♙</span>
                      <strong>No employees found</strong>
                      <p>Add an employee to start building your workforce.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="table-footer">
          <span>
            Showing {filtered.length} of {employees.length} employees
          </span>
          <div>
            <button disabled>‹</button>
            <button className="active-page">1</button>
            <button disabled>›</button>
          </div>
        </div>
      </section>
      {modal && (
        <EmployeeModal
          mode={modal}
          form={form}
          setForm={setForm}
          errors={errors}
          onClose={() => setModal(null)}
          onSubmit={saveEmployee}
        />
      )}
      {deleteEmployee && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDeleteEmployee(null);
          }}
        >
          <div className="modal confirm-modal" role="dialog" aria-modal="true">
            <span className="delete-icon">⌫</span>
            <h3>Delete Employee</h3>
            <p>
              Are you sure you want to delete{" "}
              <strong>{deleteEmployee.name}</strong>? This action cannot be
              undone.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setDeleteEmployee(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="danger-button"
                onClick={confirmDelete}
              >
                Delete Employee
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function EmployeeManagement() {
  const emptyForm = {
    employeeId: "",
    fullName: "",
    email: "",
    phone: "",
    department: "Engineering",
    designation: "",
    dateOfBirth: "",
    dateOfJoining: "",
    status: "Active",
  };
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [deleteEmployee, setDeleteEmployee] = useState(null);
  const [notification, setNotification] = useState(null);
  const notificationTimer = useRef(null);

  const notify = useCallback((type, message) => {
    setNotification({ type, message });
    window.clearTimeout(notificationTimer.current);
    notificationTimer.current = window.setTimeout(
      () => setNotification(null),
      3500,
    );
  }, []);

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (departmentFilter) params.set("department", departmentFilter);
      if (statusFilter) params.set("status", statusFilter);
      const response = await fetch(`${API_URL}/employees?${params}`);
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Unable to load employees.");
      setEmployees(
        (data.employees || []).map((employee) => ({
          ...employee,
          fullName: employee.fullName || employee.name || "",
          designation: employee.designation || employee.role || "",
          phone: employee.phone || "",
          status:
            employee.status && employee.status.toLowerCase() === "inactive"
              ? "Inactive"
              : "Active",
          dateOfBirth: employee.dateOfBirth || "",
          dateOfJoining:
            employee.dateOfJoining ||
            employee.joiningDate ||
            employee.joinDateISO ||
            employee.joinDate ||
            "",
        })),
      );
    } catch (error) {
      notify("error", error.message);
    } finally {
      setLoading(false);
    }
  }, [search, departmentFilter, statusFilter, notify]);

  useEffect(() => {
    const timer = window.setTimeout(loadEmployees, 300);
    return () => window.clearTimeout(timer);
  }, [loadEmployees]);

  const validate = () => {
    const nextErrors = {};
    if (!String(form.employeeId || "").trim())
      nextErrors.employeeId = "Employee ID is required.";
    if (!String(form.fullName || "").trim())
      nextErrors.fullName = "Full name is required.";
    if (!String(form.email || "").trim())
      nextErrors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      nextErrors.email = "Enter a valid email address.";
    if (!String(form.phone || "").trim())
      nextErrors.phone = "Phone number is required.";
    if (!form.department) nextErrors.department = "Department is required.";
    if (!String(form.designation || "").trim())
      nextErrors.designation = "Designation is required.";
    if (!form.dateOfBirth)
      nextErrors.dateOfBirth = "Date of birth is required.";
    if (!form.dateOfJoining)
      nextErrors.dateOfJoining = "Date of joining is required.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const openAdd = () => {
    setForm(emptyForm);
    setErrors({});
    setModal("add");
  };

  const openEdit = (employee) => {
    setForm({
      ...employee,
      dateOfBirth: employee.dateOfBirth
        ? employee.dateOfBirth.slice(0, 10)
        : "",
      dateOfJoining: employee.dateOfJoining
        ? employee.dateOfJoining.slice(0, 10)
        : "",
    });
    setErrors({});
    setModal("edit");
  };

  const saveEmployee = async (event) => {
    event.preventDefault();
    if (!validate()) {
      notify("error", "Please correct the highlighted fields.");
      return;
    }
    try {
      const isEdit = modal === "edit";
      const response = await fetch(
        `${API_URL}/employees${isEdit ? `/${form._id}` : "/add"}`,
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        if (data.errors) setErrors(data.errors);
        throw new Error(data.message || "Unable to save employee.");
      }
      setModal(null);
      notify(
        "success",
        data.message ||
          `Employee ${isEdit ? "updated" : "added"} successfully.`,
      );
      loadEmployees();
    } catch (error) {
      notify("error", error.message);
    }
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(
        `${API_URL}/employees/${deleteEmployee._id}`,
        { method: "DELETE" },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Unable to delete employee.");
      setDeleteEmployee(null);
      notify("success", data.message || "Employee deleted successfully.");
      loadEmployees();
    } catch (error) {
      notify("error", error.message);
    }
  };

  const filteredDepartments = [
    "All Departments",
    ...new Set(
      employees.map((employee) => employee.department).filter(Boolean),
    ),
  ];

  return (
    <>
      <PageHeader
        title="Employee Management"
        subtitle="Manage your workforce and employee information."
        action="Add Employee"
        onAction={openAdd}
      />
      {notification && (
        <div className={`notification-toast ${notification.type}`} role="alert">
          <span>{notification.type === "success" ? "✓" : "!"}</span>
          {notification.message}
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => setNotification(null)}
          >
            ×
          </button>
        </div>
      )}
      <section className="mini-stats">
        <div>
          <span>Total Employees</span>
          <strong>{employees.length}</strong>
        </div>
        <div>
          <span>Active</span>
          <strong>
            {
              employees.filter((employee) => employee.status === "Active")
                .length
            }
          </strong>
        </div>
        <div>
          <span>Inactive</span>
          <strong>
            {
              employees.filter((employee) => employee.status === "Inactive")
                .length
            }
          </strong>
        </div>
      </section>
      <section className="content-card">
        <div className="table-tools employee-tools">
          <label className="search-box">
            <span>⌕</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, email or employee ID..."
            />
          </label>
          <div className="filter-group">
            <select
              className="filter-select"
              value={departmentFilter}
              onChange={(event) =>
                setDepartmentFilter(
                  event.target.value === "All Departments"
                    ? ""
                    : event.target.value,
                )
              }
            >
              {filteredDepartments.map((department) => (
                <option key={department}>{department}</option>
              ))}
            </select>
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="">All Statuses</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
        </div>
        {loading ? (
          <div className="empty-state">
            <span>◷</span>
            <strong>Loading employees...</strong>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Employee</th>
                  <th>Designation</th>
                  <th>Department</th>
                  <th>Joining Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee._id}>
                    <td data-label="Employee ID">
                      <strong className="employee-id">
                        {employee.employeeId}
                      </strong>
                    </td>
                    <td data-label="Employee">
                      <span className="employee-cell">
                        <span className="table-avatar">
                          {initials(employee.fullName)}
                        </span>
                        <span>
                          <strong>{employee.fullName}</strong>
                          <small>{employee.email}</small>
                        </span>
                      </span>
                    </td>
                    <td data-label="Designation">{employee.designation}</td>
                    <td data-label="Department">{employee.department}</td>
                    <td data-label="Joining Date">
                      {employee.dateOfJoining &&
                      !Number.isNaN(Date.parse(employee.dateOfJoining))
                        ? new Date(employee.dateOfJoining).toLocaleDateString()
                        : employee.joinDate || "Not provided"}
                    </td>
                    <td data-label="Status">
                      <Status value={employee.status} />
                    </td>
                    <td data-label="Actions">
                      <div className="action-row">
                        <IconButton
                          label="View employee"
                          onClick={() => {
                            setForm(employee);
                            setModal("view");
                          }}
                        >
                          ◉
                        </IconButton>
                        <IconButton
                          label="Edit employee"
                          onClick={() => openEdit(employee)}
                        >
                          ✎
                        </IconButton>
                        <IconButton
                          label="Delete employee"
                          className="danger"
                          onClick={() => setDeleteEmployee(employee)}
                        >
                          ⌫
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))}
                {employees.length === 0 && (
                  <tr>
                    <td colSpan="7">
                      <div className="empty-state">
                        <span>♙</span>
                        <strong>No employees found</strong>
                        <p>Add an employee to start building your workforce.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {modal && (
        <EmployeeModal
          mode={modal}
          form={form}
          setForm={setForm}
          errors={errors}
          onClose={() => setModal(null)}
          onSubmit={saveEmployee}
        />
      )}
      {deleteEmployee && (
        <div className="modal-backdrop">
          <div className="modal confirm-modal">
            <span className="delete-icon">⌫</span>
            <h3>Delete Employee</h3>
            <p>
              Delete <strong>{deleteEmployee.fullName}</strong>? This action
              cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setDeleteEmployee(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="danger-button"
                onClick={confirmDelete}
              >
                Delete Employee
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function EmployeeModal({ mode, form, setForm, errors, onClose, onSubmit }) {
  const readOnly = mode === "view";
  const setField = (name, value) =>
    setForm((current) => ({ ...current, [name]: value }));
  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h3>
            {mode === "add"
              ? "Add Employee"
              : mode === "edit"
                ? "Edit Employee"
                : "Employee Details"}
          </h3>
          <IconButton label="Close" onClick={onClose}>
            ×
          </IconButton>
        </div>
        {readOnly ? (
          <div className="employee-profile">
            <span className="profile-avatar">{initials(form.fullName)}</span>
            <h2>{form.fullName}</h2>
            <p>{form.designation}</p>
            <dl>
              <div>
                <dt>Employee ID</dt>
                <dd>{form.employeeId}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{form.email}</dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>{form.phone}</dd>
              </div>
              <div>
                <dt>Department</dt>
                <dd>{form.department}</dd>
              </div>
              <div>
                <dt>Designation</dt>
                <dd>{form.designation}</dd>
              </div>
              <div>
                <dt>Date of Birth</dt>
                <dd>{new Date(form.dateOfBirth).toLocaleDateString()}</dd>
              </div>
              <div>
                <dt>Date of Joining</dt>
                <dd>{new Date(form.dateOfJoining).toLocaleDateString()}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>
                  <Status value={form.status} />
                </dd>
              </div>
            </dl>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="employee-form" noValidate>
            <label>
              Employee ID
              <input
                value={form.employeeId || ""}
                onChange={(e) => setField("employeeId", e.target.value)}
                aria-invalid={Boolean(errors.employeeId)}
              />
              <small className="field-error">{errors.employeeId}</small>
            </label>
            <label>
              Full Name
              <input
                value={form.fullName || ""}
                onChange={(e) => setField("fullName", e.target.value)}
                aria-invalid={Boolean(errors.fullName)}
              />
              <small className="field-error">{errors.fullName}</small>
            </label>
            <label>
              Email Address
              <input
                type="email"
                value={form.email || ""}
                onChange={(e) => setField("email", e.target.value)}
                aria-invalid={Boolean(errors.email)}
              />
              <small className="field-error">{errors.email}</small>
            </label>
            <label>
              Phone Number
              <input
                value={form.phone || ""}
                onChange={(e) => setField("phone", e.target.value)}
                aria-invalid={Boolean(errors.phone)}
              />
              <small className="field-error">{errors.phone}</small>
            </label>
            <label>
              Designation
              <input
                value={form.designation || ""}
                onChange={(e) => setField("designation", e.target.value)}
                placeholder="e.g. Product Designer"
                aria-invalid={Boolean(errors.designation)}
              />
              <small className="field-error">{errors.designation}</small>
            </label>
            <label>
              Department
              <select
                value={form.department || "Engineering"}
                onChange={(e) => setField("department", e.target.value)}
              >
                <option>Engineering</option>
                <option>Design</option>
                <option>Human Resources</option>
                <option>Marketing</option>
                <option>Finance</option>
                <option>Operations</option>
              </select>
              <small className="field-error">{errors.department}</small>
            </label>
            <label>
              Date of Birth
              <input
                type="date"
                value={form.dateOfBirth || ""}
                onChange={(e) => setField("dateOfBirth", e.target.value)}
                aria-invalid={Boolean(errors.dateOfBirth)}
              />
              <small className="field-error">{errors.dateOfBirth}</small>
            </label>
            <label>
              Date of Joining
              <input
                type="date"
                value={form.dateOfJoining || ""}
                onChange={(e) => setField("dateOfJoining", e.target.value)}
                aria-invalid={Boolean(errors.dateOfJoining)}
              />
              <small className="field-error">{errors.dateOfJoining}</small>
            </label>
            <label>
              Employment Status
              <select
                value={form.status || "Active"}
                onChange={(e) => setField("status", e.target.value)}
              >
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </label>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={onClose}
              >
                Cancel
              </button>
              <button type="submit" className="primary-button">
                {mode === "add" ? "Add Employee" : "Save Changes"}
              </button>
            </div>
          </form>
        )}
        {readOnly && (
          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ModuleTable({
  title,
  subtitle,
  columns,
  rows,
  searchPlaceholder = "Search...",
}) {
  const [search, setSearch] = useState("");
  const filtered = rows.filter((row) =>
    Object.values(row).join(" ").toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <section className="content-card">
      <div className="module-card-heading">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
        <label className="search-box">
          <span>⌕</span>
          <input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, index) => (
              <tr key={index}>
                {columns.map((column) => (
                  <td key={column.key}>
                    {column.status ? (
                      <Status value={row[column.key]} />
                    ) : (
                      row[column.key]
                    )}
                  </td>
                ))}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={columns.length}>
                  <div className="empty-state">
                    <span>▤</span>
                    <strong>No records available</strong>
                    <p>Data will appear here when records are added.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Attendance() {
  const emptyForm = {
    employeeId: "",
    date: new Date().toISOString().slice(0, 10),
    checkIn: "",
    checkOut: "",
    status: "Present",
    notes: "",
  };
  const [employees, setEmployees] = useState([]);
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({
    present: 0,
    absent: 0,
    late: 0,
    remote: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (date) params.set("date", date);
      if (statusFilter) params.set("status", statusFilter);
      const [recordResponse, employeeResponse] = await Promise.all([
        fetch(`${API_URL}/hr/attendance?${params}`),
        fetch(`${API_URL}/employees?status=active`),
      ]);
      const recordData = await recordResponse.json();
      const employeeData = await employeeResponse.json();
      if (!recordResponse.ok)
        throw new Error(recordData.message || "Unable to load attendance.");
      setRecords(recordData.records || []);
      setSummary(
        recordData.summary || { present: 0, absent: 0, late: 0, remote: 0 },
      );
      setEmployees(employeeData.employees || []);
    } catch (error) {
      setMessage({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  }, [search, date, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setModal(true);
  };
  const openEdit = (record) => {
    setEditing(record);
    setForm({
      employeeId: record.employee?._id || "",
      date: record.date || "",
      checkIn: record.checkIn || "",
      checkOut: record.checkOut || "",
      status: record.status || "Present",
      notes: record.notes || "",
    });
    setModal(true);
  };

  const save = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch(
        `${API_URL}/hr/attendance${editing ? `/${editing._id}` : ""}`,
        {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Unable to save attendance.");
      setModal(false);
      setMessage({ type: "success", message: data.message });
      load();
    } catch (error) {
      setMessage({ type: "error", message: error.message });
    }
  };

  const exportCsv = () => {
    const escape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const rows = [
      [
        "Employee",
        "Employee ID",
        "Date",
        "Check In",
        "Check Out",
        "Working Hours",
        "Status",
      ],
      ...records.map((record) => [
        record.employee?.fullName || record.employee?.name || "",
        record.employee?.employeeId || "",
        record.date,
        record.checkIn || "",
        record.checkOut || "",
        Number(record.workingHours || 0).toFixed(2),
        record.status,
      ]),
    ];
    const blob = new Blob(
      [rows.map((row) => row.map(escape).join(",")).join("\n")],
      { type: "text/csv;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance-report-${date || "all"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {message && (
        <div className={`notification-toast ${message.type}`}>
          <span>{message.type === "success" ? "✓" : "!"}</span>
          {message.message}
        </div>
      )}
      <header className="page-header">
        <div>
          <h1>Attendance Management</h1>
          <p>Monitor daily attendance and working hours.</p>
        </div>
        <div className="page-header-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={exportCsv}
          >
            Export Report
          </button>
          <button className="primary-button" type="button" onClick={openAdd}>
            <span>＋</span> Mark Attendance
          </button>
        </div>
      </header>
      <section className="mini-stats">
        <div>
          <span>Present</span>
          <strong>{summary.present}</strong>
        </div>
        <div>
          <span>Absent</span>
          <strong>{summary.absent}</strong>
        </div>
        <div>
          <span>Late Arrivals</span>
          <strong>{summary.late}</strong>
        </div>
        <div>
          <span>Remote</span>
          <strong>{summary.remote}</strong>
        </div>
      </section>
      <section className="content-card">
        <div className="module-card-heading">
          <div>
            <h3>Daily Attendance</h3>
            <p>
              {loading ? "Loading records..." : `${records.length} record(s)`}
            </p>
          </div>
        </div>
        <div className="table-tools employee-tools">
          <label className="search-box">
            <span>⌕</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search employee..."
            />
          </label>
          <div className="filter-group">
            <input
              className="filter-select"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="">All Statuses</option>
              <option>Present</option>
              <option>Absent</option>
              <option>Late</option>
              <option>Remote</option>
            </select>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Working Hours</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record._id}>
                  <td>
                    {record.employee?.fullName ||
                      record.employee?.name ||
                      "Unknown"}
                  </td>
                  <td>{record.date}</td>
                  <td>{record.checkIn || "-"}</td>
                  <td>{record.checkOut || "-"}</td>
                  <td>{Number(record.workingHours || 0).toFixed(2)}</td>
                  <td>
                    <Status value={record.status} />
                  </td>
                  <td>
                    <button
                      className="text-button"
                      type="button"
                      onClick={() => openEdit(record)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && records.length === 0 && (
                <tr>
                  <td colSpan="7">
                    <div className="empty-state">
                      <span>◷</span>
                      <strong>No attendance records</strong>
                      <p>Mark attendance to create a database record.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      {modal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>{editing ? "Edit Attendance" : "Mark Attendance"}</h3>
              <IconButton label="Close" onClick={() => setModal(false)}>
                ×
              </IconButton>
            </div>
            <form className="employee-form" onSubmit={save}>
              <label>
                Employee
                <select
                  value={form.employeeId}
                  disabled={Boolean(editing)}
                  onChange={(event) =>
                    setForm({ ...form, employeeId: event.target.value })
                  }
                >
                  <option value="">Select employee</option>
                  {employees.map((employee) => (
                    <option key={employee._id} value={employee._id}>
                      {employee.fullName || employee.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Date
                <input
                  type="date"
                  value={form.date}
                  onChange={(event) =>
                    setForm({ ...form, date: event.target.value })
                  }
                />
              </label>
              <label>
                Check In
                <input
                  type="time"
                  value={form.checkIn}
                  onChange={(event) =>
                    setForm({ ...form, checkIn: event.target.value })
                  }
                />
              </label>
              <label>
                Check Out
                <input
                  type="time"
                  value={form.checkOut}
                  onChange={(event) =>
                    setForm({ ...form, checkOut: event.target.value })
                  }
                />
              </label>
              <label>
                Status
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm({ ...form, status: event.target.value })
                  }
                >
                  <option>Present</option>
                  <option>Absent</option>
                  <option>Late</option>
                  <option>Remote</option>
                </select>
              </label>
              <label>
                Notes
                <input
                  value={form.notes}
                  onChange={(event) =>
                    setForm({ ...form, notes: event.target.value })
                  }
                />
              </label>
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  {editing ? "Save Changes" : "Save Attendance"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function Leave() {
  const leaveTypes = [
    "Casual Leave",
    "Sick Leave",
    "Earned Leave",
    "Unpaid Leave",
  ];
  const emptyForm = {
    employeeId: "",
    leaveType: "Casual Leave",
    startDate: "",
    endDate: "",
    reason: "",
  };
  const [employees, setEmployees] = useState([]);
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({
    pending: 0,
    approvedThisMonth: 0,
    rejected: 0,
    availableDays: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [leaveTypeFilter, setLeaveTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [balances, setBalances] = useState([]);
  const [message, setMessage] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (leaveTypeFilter) params.set("leaveType", leaveTypeFilter);
      if (statusFilter) params.set("status", statusFilter);
      const [leaveResponse, employeeResponse] = await Promise.all([
        fetch(`${API_URL}/hr/leave?${params}`),
        fetch(`${API_URL}/employees?status=active`),
      ]);
      const leaveData = await leaveResponse.json();
      const employeeData = await employeeResponse.json();
      if (!leaveResponse.ok)
        throw new Error(leaveData.message || "Unable to load leave requests.");
      setRecords(leaveData.records || []);
      setSummary(
        leaveData.summary || { pending: 0, approvedThisMonth: 0, rejected: 0 },
      );
      setEmployees(employeeData.employees || []);
    } catch (error) {
      setMessage({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  }, [search, leaveTypeFilter, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const duration =
    form.startDate && form.endDate && form.endDate >= form.startDate
      ? Math.floor(
          (Date.parse(`${form.endDate}T00:00:00Z`) -
            Date.parse(`${form.startDate}T00:00:00Z`)) /
            86400000,
        ) + 1
      : 0;

  const submitLeave = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch(`${API_URL}/hr/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Unable to submit leave request.");
      setModal(null);
      setForm(emptyForm);
      setMessage({ type: "success", message: data.message });
      load();
    } catch (error) {
      setMessage({ type: "error", message: error.message });
    }
  };

  const review = async (record, status) => {
    try {
      const response = await fetch(`${API_URL}/hr/leave/${record._id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Unable to review leave request.");
      setSelected(null);
      setMessage({ type: "success", message: data.message });
      load();
    } catch (error) {
      setMessage({ type: "error", message: error.message });
    }
  };

  const openBalances = async (employeeId = "") => {
    if (!employeeId) return;
    try {
      const response = await fetch(
        `${API_URL}/hr/leave/balances/${employeeId}`,
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Unable to load leave balances.");
      const byType = Object.fromEntries(
        (data.balances || []).map((balance) => [
          balance.leaveType,
          balance.availableDays,
        ]),
      );
      setBalances(
        leaveTypes.map((leaveType) => ({
          leaveType,
          availableDays: Number(byType[leaveType] || 0),
        })),
      );
      setForm((current) => ({ ...current, employeeId }));
      setModal("balance");
    } catch (error) {
      setMessage({ type: "error", message: error.message });
    }
  };

  const saveBalances = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch(
        `${API_URL}/hr/leave/balances/${form.employeeId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ year: new Date().getFullYear(), balances }),
        },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Unable to save leave balances.");
      setModal(null);
      setMessage({ type: "success", message: data.message });
    } catch (error) {
      setMessage({ type: "error", message: error.message });
    }
  };

  return (
    <>
      {message && (
        <div className={`notification-toast ${message.type}`}>
          <span>{message.type === "success" ? "✓" : "!"}</span>
          {message.message}
        </div>
      )}
      <header className="page-header">
        <div>
          <h1>Leave Management</h1>
          <p>Review leave requests and employee balances.</p>
        </div>
        <div className="page-header-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={() => {
              setForm(emptyForm);
              setModal("balance-select");
            }}
          >
            Configure Balance
          </button>
          <button
            className="primary-button"
            type="button"
            onClick={() => {
              setForm(emptyForm);
              setModal("request");
            }}
          >
            <span>＋</span> New Leave Request
          </button>
        </div>
      </header>
      <section className="mini-stats">
        <div>
          <span>Pending Requests</span>
          <strong>{summary.pending}</strong>
        </div>
        <div>
          <span>Approved This Month</span>
          <strong>{summary.approvedThisMonth}</strong>
        </div>
        <div>
          <span>Rejected</span>
          <strong>{summary.rejected}</strong>
        </div>
        <div>
          <span>Available Days</span>
          <strong>{Number(summary.availableDays || 0)}</strong>
        </div>
      </section>
      <section className="content-card">
        <div className="module-card-heading">
          <div>
            <h3>Leave Requests</h3>
            <p>
              {loading ? "Loading requests..." : `${records.length} request(s)`}
            </p>
          </div>
        </div>
        <div className="table-tools employee-tools">
          <label className="search-box">
            <span>⌕</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search employee..."
            />
          </label>
          <div className="filter-group">
            <select
              className="filter-select"
              value={leaveTypeFilter}
              onChange={(event) => setLeaveTypeFilter(event.target.value)}
            >
              <option value="">All Leave Types</option>
              {leaveTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="">All Statuses</option>
              <option>Pending</option>
              <option>Approved</option>
              <option>Rejected</option>
            </select>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Leave Type</th>
                <th>From</th>
                <th>To</th>
                <th>Days</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record._id}>
                  <td>
                    {record.employee?.fullName ||
                      record.employee?.name ||
                      "Unknown"}
                  </td>
                  <td>{record.leaveType}</td>
                  <td>{record.startDate}</td>
                  <td>{record.endDate}</td>
                  <td>{record.durationDays}</td>
                  <td>
                    <Status value={record.status} />
                  </td>
                  <td>
                    <div className="action-row">
                      <button
                        className="text-button"
                        type="button"
                        onClick={() => setSelected(record)}
                      >
                        View
                      </button>
                      {record.status === "Pending" && (
                        <>
                          <button
                            className="text-button"
                            type="button"
                            onClick={() => review(record, "Approved")}
                          >
                            Approve
                          </button>
                          <button
                            className="text-button danger-text"
                            type="button"
                            onClick={() => review(record, "Rejected")}
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && records.length === 0 && (
                <tr>
                  <td colSpan="7">
                    <div className="empty-state">
                      <span>▤</span>
                      <strong>No leave requests</strong>
                      <p>Create a request to add a real database record.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      {modal === "request" && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>New Leave Request</h3>
              <IconButton label="Close" onClick={() => setModal(null)}>
                ×
              </IconButton>
            </div>
            <form className="employee-form" onSubmit={submitLeave}>
              <label>
                Employee
                <select
                  value={form.employeeId}
                  onChange={(event) =>
                    setForm({ ...form, employeeId: event.target.value })
                  }
                >
                  <option value="">Select employee</option>
                  {employees.map((employee) => (
                    <option key={employee._id} value={employee._id}>
                      {employee.fullName || employee.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Leave Type
                <select
                  value={form.leaveType}
                  onChange={(event) =>
                    setForm({ ...form, leaveType: event.target.value })
                  }
                >
                  {leaveTypes.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </label>
              <label>
                Start Date
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(event) =>
                    setForm({ ...form, startDate: event.target.value })
                  }
                />
              </label>
              <label>
                End Date
                <input
                  type="date"
                  min={form.startDate}
                  value={form.endDate}
                  onChange={(event) =>
                    setForm({ ...form, endDate: event.target.value })
                  }
                />
              </label>
              <label className="full-width">
                Leave Reason
                <textarea
                  value={form.reason}
                  onChange={(event) =>
                    setForm({ ...form, reason: event.target.value })
                  }
                />
              </label>
              <label>
                Calculated Duration
                <input
                  readOnly
                  value={duration ? `${duration} day(s)` : "Select valid dates"}
                />
              </label>
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setModal(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {modal === "balance-select" && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>Configure Leave Balance</h3>
              <IconButton label="Close" onClick={() => setModal(null)}>
                ×
              </IconButton>
            </div>
            <div className="settings-form">
              <label>
                Employee
                <select
                  value={form.employeeId}
                  onChange={(event) =>
                    setForm({ ...form, employeeId: event.target.value })
                  }
                >
                  <option value="">Select employee</option>
                  {employees.map((employee) => (
                    <option key={employee._id} value={employee._id}>
                      {employee.fullName || employee.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setModal(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => openBalances(form.employeeId)}
                >
                  Load Balance
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {modal === "balance" && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>Leave Balance</h3>
              <IconButton label="Close" onClick={() => setModal(null)}>
                ×
              </IconButton>
            </div>
            <form className="settings-form" onSubmit={saveBalances}>
              {balances.map((balance, index) => (
                <label key={balance.leaveType}>
                  {balance.leaveType}
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={balance.availableDays}
                    onChange={(event) =>
                      setBalances((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, availableDays: event.target.value }
                            : item,
                        ),
                      )
                    }
                  />
                </label>
              ))}
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setModal(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  Save Balance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {selected && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>Leave Request Details</h3>
              <IconButton label="Close" onClick={() => setSelected(null)}>
                ×
              </IconButton>
            </div>
            <div className="employee-profile">
              <dl>
                <div>
                  <dt>Employee</dt>
                  <dd>
                    {selected.employee?.fullName || selected.employee?.name}
                  </dd>
                </div>
                <div>
                  <dt>Leave Type</dt>
                  <dd>{selected.leaveType}</dd>
                </div>
                <div>
                  <dt>Duration</dt>
                  <dd>
                    {selected.startDate} to {selected.endDate} (
                    {selected.durationDays} days)
                  </dd>
                </div>
                <div>
                  <dt>Reason</dt>
                  <dd>{selected.reason}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>
                    <Status value={selected.status} />
                  </dd>
                </div>
              </dl>
            </div>
            {selected.status === "Pending" && (
              <div className="modal-actions">
                <button
                  className="danger-button"
                  type="button"
                  onClick={() => review(selected, "Rejected")}
                >
                  Reject
                </button>
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => review(selected, "Approved")}
                >
                  Approve
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function Payroll() {
  const [employees, setEmployees] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [payPeriod, setPayPeriod] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modal, setModal] = useState(null);
  const [salaryEmployeeId, setSalaryEmployeeId] = useState("");
  const [salaryForm, setSalaryForm] = useState({
    basicSalary: "",
    allowances: "",
    deductions: "",
  });
  const [runEmployeeIds, setRunEmployeeIds] = useState([]);
  const [runPeriod, setRunPeriod] = useState(
    new Date().toISOString().slice(0, 7),
  );
  const [previews, setPreviews] = useState([]);
  const [message, setMessage] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (payPeriod) params.set("payPeriod", payPeriod);
      if (statusFilter) params.set("status", statusFilter);
      const [payrollResponse, employeeResponse] = await Promise.all([
        fetch(`${API_URL}/hr/payroll?${params}`),
        fetch(`${API_URL}/employees?status=active`),
      ]);
      const payrollData = await payrollResponse.json();
      const employeeData = await employeeResponse.json();
      if (!payrollResponse.ok)
        throw new Error(payrollData.message || "Unable to load payroll.");
      setRecords(payrollData.records || []);
      setEmployees(employeeData.employees || []);
    } catch (error) {
      setMessage({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  }, [search, payPeriod, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const openSalary = async () => {
    setSalaryEmployeeId("");
    setSalaryForm({ basicSalary: "", allowances: "", deductions: "" });
    setModal("salary-select");
  };

  const loadSalary = async () => {
    if (!salaryEmployeeId) {
      setMessage({ type: "error", message: "Select an employee." });
      return;
    }
    try {
      const response = await fetch(`${API_URL}/hr/salary/${salaryEmployeeId}`);
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Unable to load salary structure.");
      setSalaryForm({
        basicSalary: data.salary?.basicSalary ?? "",
        allowances: data.salary?.allowances ?? "",
        deductions: data.salary?.deductions ?? "",
      });
      setModal("salary");
    } catch (error) {
      setMessage({ type: "error", message: error.message });
    }
  };

  const saveSalary = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch(`${API_URL}/hr/salary/${salaryEmployeeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(salaryForm),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Unable to save salary structure.");
      setModal(null);
      setMessage({ type: "success", message: data.message });
    } catch (error) {
      setMessage({ type: "error", message: error.message });
    }
  };

  const previewPayroll = async () => {
    try {
      const response = await fetch(`${API_URL}/hr/payroll/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeIds: runEmployeeIds,
          payPeriod: runPeriod,
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Unable to preview payroll.");
      setPreviews(data.previews || []);
      setModal("preview");
    } catch (error) {
      setMessage({ type: "error", message: error.message });
    }
  };

  const confirmPayroll = async () => {
    try {
      const response = await fetch(`${API_URL}/hr/payroll/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payPeriod: runPeriod, previews }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Unable to save payroll.");
      setModal(null);
      setMessage({ type: "success", message: data.message });
      load();
    } catch (error) {
      setMessage({ type: "error", message: error.message });
    }
  };

  const markPaid = async (record) => {
    if (record.status === "Paid") return;
    if (
      !window.confirm(
        `Mark payroll for ${record.employee?.fullName || record.employee?.name || "this employee"} as Paid? No bank payment will be initiated.`,
      )
    )
      return;
    try {
      const response = await fetch(
        `${API_URL}/hr/payroll/${record._id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "Paid", confirmPaid: true }),
        },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Unable to update payroll status.");
      setMessage({ type: "success", message: data.message });
      load();
    } catch (error) {
      setMessage({ type: "error", message: error.message });
    }
  };

  const exportCsv = () => {
    const escape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const rows = [
      [
        "Employee",
        "Employee ID",
        "Pay Period",
        "Basic Salary",
        "Allowances",
        "Deductions",
        "Gross Salary",
        "Net Salary",
        "Status",
      ],
      ...records.map((record) => [
        record.employee?.fullName || record.employee?.name || "",
        record.employee?.employeeId || "",
        record.payPeriod,
        record.basicSalary,
        record.allowances,
        record.deductions,
        record.grossSalary,
        record.netSalary,
        record.status,
      ]),
    ];
    const blob = new Blob(
      [rows.map((row) => row.map(escape).join(",")).join("\n")],
      { type: "text/csv;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `payroll-${payPeriod || "all"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const indianCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  const monthlyPayroll = records
    .filter((record) => !payPeriod || record.payPeriod === payPeriod)
    .reduce((total, record) => total + Number(record.grossSalary || 0), 0);
  const filteredPeriodRecords = records.filter(
    (record) => !payPeriod || record.payPeriod === payPeriod,
  );
  const employeesPaid = filteredPeriodRecords.filter(
    (record) => record.status === "Paid",
  ).length;
  const pendingPayroll = filteredPeriodRecords.filter(
    (record) => record.status !== "Paid",
  ).length;

  return (
    <>
      {message && (
        <div className={`notification-toast ${message.type}`}>
          <span>{message.type === "success" ? "✓" : "!"}</span>
          {message.message}
        </div>
      )}
      <header className="page-header">
        <div>
          <h1>Payroll Management</h1>
          <p>Review payroll, deductions, and employee payouts.</p>
        </div>
        <div className="page-header-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={exportCsv}
          >
            Export Report
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={openSalary}
          >
            Salary Structure
          </button>
          <button
            className="primary-button"
            type="button"
            onClick={() => {
              setRunEmployeeIds([]);
              setPreviews([]);
              setModal("run");
            }}
          >
            <span>＋</span> Run Payroll
          </button>
        </div>
      </header>
      <section className="mini-stats">
        <div>
          <span>Monthly Payroll</span>
          <strong>{indianCurrency(monthlyPayroll)}</strong>
        </div>
        <div>
          <span>Employees Paid</span>
          <strong>{employeesPaid}</strong>
        </div>
        <div>
          <span>Pending</span>
          <strong>{pendingPayroll}</strong>
        </div>
        <div>
          <span>Next Pay Date</span>
          <strong>Not configured</strong>
        </div>
      </section>
      <section className="content-card">
        <div className="module-card-heading">
          <div>
            <h3>Payroll Records</h3>
            <p>
              {loading ? "Loading payroll..." : `${records.length} record(s)`}
            </p>
          </div>
        </div>
        <div className="table-tools employee-tools">
          <label className="search-box">
            <span>⌕</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search employee..."
            />
          </label>
          <div className="filter-group">
            <input
              className="filter-select"
              type="month"
              value={payPeriod}
              onChange={(event) => setPayPeriod(event.target.value)}
            />
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="">All Statuses</option>
              <option>Draft</option>
              <option>Processed</option>
              <option>Paid</option>
            </select>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Pay Period</th>
                <th>Gross Pay</th>
                <th>Deductions</th>
                <th>Net Pay</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record._id}>
                  <td>
                    {record.employee?.fullName ||
                      record.employee?.name ||
                      "Unknown"}
                  </td>
                  <td>{record.payPeriod}</td>
                  <td>{indianCurrency(record.grossSalary)}</td>
                  <td>{indianCurrency(record.deductions)}</td>
                  <td>{indianCurrency(record.netSalary)}</td>
                  <td>
                    <Status value={record.status} />
                  </td>
                  <td>
                    {record.status !== "Paid" ? (
                      <button
                        className="text-button"
                        type="button"
                        onClick={() => markPaid(record)}
                      >
                        Mark Paid
                      </button>
                    ) : (
                      <span>-</span>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && records.length === 0 && (
                <tr>
                  <td colSpan="7">
                    <div className="empty-state">
                      <span>◉</span>
                      <strong>No payroll records</strong>
                      <p>
                        Configure salary structures, preview payroll, and
                        confirm it to create records.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      {modal === "salary-select" && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>Salary Structure</h3>
              <IconButton label="Close" onClick={() => setModal(null)}>
                ×
              </IconButton>
            </div>
            <div className="settings-form">
              <label>
                Employee
                <select
                  value={salaryEmployeeId}
                  onChange={(event) => setSalaryEmployeeId(event.target.value)}
                >
                  <option value="">Select employee</option>
                  {employees.map((employee) => (
                    <option key={employee._id} value={employee._id}>
                      {employee.fullName || employee.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setModal(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="primary-button"
                  onClick={loadSalary}
                >
                  Configure Salary
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {modal === "salary" && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>Configure Salary</h3>
              <IconButton label="Close" onClick={() => setModal(null)}>
                ×
              </IconButton>
            </div>
            <form className="employee-form" onSubmit={saveSalary}>
              <label>
                Basic Salary (₹)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={salaryForm.basicSalary}
                  onChange={(event) =>
                    setSalaryForm({
                      ...salaryForm,
                      basicSalary: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                Allowances (₹)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={salaryForm.allowances}
                  onChange={(event) =>
                    setSalaryForm({
                      ...salaryForm,
                      allowances: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                Deductions (₹)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={salaryForm.deductions}
                  onChange={(event) =>
                    setSalaryForm({
                      ...salaryForm,
                      deductions: event.target.value,
                    })
                  }
                />
              </label>
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setModal(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  Save Salary
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {modal === "run" && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>Run Payroll</h3>
              <IconButton label="Close" onClick={() => setModal(null)}>
                ×
              </IconButton>
            </div>
            <div className="settings-form">
              <label>
                Payroll Month
                <input
                  type="month"
                  value={runPeriod}
                  onChange={(event) => setRunPeriod(event.target.value)}
                />
              </label>
              <label>
                Employees
                <select
                  multiple
                  value={runEmployeeIds}
                  onChange={(event) =>
                    setRunEmployeeIds(
                      [...event.target.selectedOptions].map(
                        (option) => option.value,
                      ),
                    )
                  }
                >
                  {employees.map((employee) => (
                    <option key={employee._id} value={employee._id}>
                      {employee.fullName || employee.name}
                    </option>
                  ))}
                </select>
              </label>
              <p className="form-note">
                Employees without a configured salary will be shown and must
                have salary information saved before confirmation.
              </p>
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setModal(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="primary-button"
                  onClick={previewPayroll}
                >
                  Preview Payroll
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {modal === "preview" && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>Payroll Preview</h3>
              <IconButton label="Close" onClick={() => setModal(null)}>
                ×
              </IconButton>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Basic</th>
                    <th>Allowances</th>
                    <th>Deductions</th>
                    <th>Gross</th>
                    <th>Net</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {previews.map((preview) => (
                    <tr key={preview.employeeId}>
                      <td>{preview.employeeName}</td>
                      {preview.configured ? (
                        <>
                          <td>{indianCurrency(preview.basicSalary)}</td>
                          <td>{indianCurrency(preview.allowances)}</td>
                          <td>{indianCurrency(preview.deductions)}</td>
                          <td>{indianCurrency(preview.grossSalary)}</td>
                          <td>{indianCurrency(preview.netSalary)}</td>
                          <td>
                            <Status value="Ready" />
                          </td>
                        </>
                      ) : (
                        <>
                          <td colSpan="5">
                            Salary information not configured.
                          </td>
                          <td>
                            <Status value="Inactive" />
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setModal("run")}
              >
                Back
              </button>
              <button
                type="button"
                className="primary-button"
                disabled={!previews.some((preview) => preview.configured)}
                onClick={confirmPayroll}
              >
                Confirm and Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Recruitment() {
  const emptyJob = {
    title: "",
    department: "",
    location: "",
    employmentType: "Full Time",
    description: "",
    requiredSkills: "",
    salaryMin: "",
    salaryMax: "",
    vacancies: 1,
    status: "Open",
  };
  const emptyCandidate = {
    name: "",
    email: "",
    phone: "",
    appliedJob: "",
    experience: 0,
    skills: "",
  };
  const emptyInterview = {
    candidate: "",
    date: "",
    time: "",
    interviewer: "",
    interviewType: "Video",
    notes: "",
    feedback: "",
  };
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [stats, setStats] = useState({
    openJobs: 0,
    candidates: 0,
    scheduledInterviews: 0,
    selectedCandidates: 0,
  });
  const [tab, setTab] = useState("jobs");
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modal, setModal] = useState(null);
  const [editingJob, setEditingJob] = useState(null);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [editingInterview, setEditingInterview] = useState(null);
  const [jobForm, setJobForm] = useState(emptyJob);
  const [candidateForm, setCandidateForm] = useState(emptyCandidate);
  const [candidateResume, setCandidateResume] = useState(null);
  const [interviewForm, setInterviewForm] = useState(emptyInterview);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  const notify = (type, text) => setMessage({ type, text });
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [
        jobsResponse,
        candidatesResponse,
        interviewsResponse,
        dashboardResponse,
      ] = await Promise.all([
        fetch(`${API_URL}/recruitment/jobs`),
        fetch(`${API_URL}/recruitment/candidates`),
        fetch(`${API_URL}/recruitment/interviews`),
        fetch(`${API_URL}/recruitment/dashboard`),
      ]);
      const [jobsData, candidatesData, interviewsData, dashboardData] =
        await Promise.all([
          jobsResponse.json(),
          candidatesResponse.json(),
          interviewsResponse.json(),
          dashboardResponse.json(),
        ]);
      if (jobsData.success) setJobs(jobsData.jobs);
      if (candidatesData.success) setCandidates(candidatesData.candidates);
      if (interviewsData.success) setInterviews(interviewsData.interviews);
      if (dashboardData.success) setStats(dashboardData.stats);
    } catch {
      notify("error", "Unable to load recruitment records.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const openJob = (job = null) => {
    setEditingJob(job);
    setJobForm(
      job
        ? { ...job, requiredSkills: (job.requiredSkills || []).join(", ") }
        : emptyJob,
    );
    setModal("job");
  };
  const saveJob = async (event) => {
    event.preventDefault();
    if (
      !jobForm.title ||
      !jobForm.department ||
      !jobForm.location ||
      !jobForm.description
    ) {
      notify("error", "Complete all required job fields.");
      return;
    }
    try {
      const response = await fetch(
        `${API_URL}/recruitment/jobs${editingJob ? `/${editingJob._id}` : ""}`,
        {
          method: editingJob ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(jobForm),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setModal(null);
      notify(
        "success",
        editingJob ? "Job opening updated." : "Job opening created.",
      );
      load();
    } catch (error) {
      notify("error", error.message);
    }
  };
  const deleteJob = async (job) => {
    if (!window.confirm(`Delete "${job.title}"?`)) return;
    try {
      const response = await fetch(`${API_URL}/recruitment/jobs/${job._id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      notify("success", data.message);
      load();
    } catch (error) {
      notify("error", error.message);
    }
  };
  const openCandidate = (candidate = null) => {
    setEditingCandidate(candidate);
    setCandidateForm(
      candidate
        ? {
            name: candidate.name,
            email: candidate.email,
            phone: candidate.phone,
            appliedJob: candidate.appliedJob?._id || candidate.appliedJob,
            experience: candidate.experience,
            skills: (candidate.skills || []).join(", "),
          }
        : emptyCandidate,
    );
    setCandidateResume(null);
    setModal("candidate");
  };
  const saveCandidate = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    Object.entries(candidateForm).forEach(([key, value]) =>
      formData.append(key, value),
    );
    if (candidateResume) formData.append("resume", candidateResume);
    try {
      const response = await fetch(
        `${API_URL}/recruitment/candidates${editingCandidate ? `/${editingCandidate._id}` : ""}`,
        { method: editingCandidate ? "PUT" : "POST", body: formData },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setModal(null);
      notify(
        "success",
        editingCandidate ? "Candidate updated." : "Candidate added.",
      );
      load();
    } catch (error) {
      notify("error", error.message);
    }
  };
  const deleteCandidate = async (candidate) => {
    if (!window.confirm(`Delete candidate "${candidate.name}"?`)) return;
    try {
      const response = await fetch(
        `${API_URL}/recruitment/candidates/${candidate._id}`,
        { method: "DELETE" },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      notify("success", data.message);
      load();
    } catch (error) {
      notify("error", error.message);
    }
  };
  const updateStage = async (candidate, stage) => {
    try {
      const response = await fetch(
        `${API_URL}/recruitment/candidates/${candidate._id}/stage`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stage }),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      notify("success", `Candidate moved to ${stage}.`);
      load();
    } catch (error) {
      notify("error", error.message);
    }
  };
  const openInterview = (interview = null) => {
    setEditingInterview(interview);
    setInterviewForm(
      interview
        ? {
            candidate: interview.candidate?._id || interview.candidate,
            date: interview.date,
            time: interview.time,
            interviewer: interview.interviewer,
            interviewType: interview.interviewType,
            notes: interview.notes || "",
            feedback: interview.feedback || "",
            status: interview.status,
          }
        : emptyInterview,
    );
    setModal("interview");
  };
  const saveInterview = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch(
        `${API_URL}/recruitment/interviews${editingInterview ? `/${editingInterview._id}` : ""}`,
        {
          method: editingInterview ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(interviewForm),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setModal(null);
      notify(
        "success",
        editingInterview ? "Interview updated." : "Interview scheduled.",
      );
      load();
    } catch (error) {
      notify("error", error.message);
    }
  };
  const setInterviewStatus = async (interview, status) => {
    try {
      const response = await fetch(
        `${API_URL}/recruitment/interviews/${interview._id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      notify("success", `Interview marked ${status}.`);
      load();
    } catch (error) {
      notify("error", error.message);
    }
  };
  const filteredJobs = jobs.filter(
    (job) =>
      `${job.title} ${job.department}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (!department || job.department === department) &&
      (!statusFilter || job.status === statusFilter),
  );
  const departments = [
    ...new Set(jobs.map((job) => job.department).filter(Boolean)),
  ];

  return (
    <>
      <PageHeader
        title="Recruitment Management"
        subtitle="Manage jobs, candidates and interviews."
        action="Add Job"
        onAction={() => openJob()}
      />
      <section className="mini-stats">
        <div>
          <span>Total Open Jobs</span>
          <strong>{loading ? "..." : stats.openJobs}</strong>
        </div>
        <div>
          <span>Total Candidates</span>
          <strong>{loading ? "..." : stats.candidates}</strong>
        </div>
        <div>
          <span>Interviews Scheduled</span>
          <strong>{loading ? "..." : stats.scheduledInterviews}</strong>
        </div>
        <div>
          <span>Selected Candidates</span>
          <strong>{loading ? "..." : stats.selectedCandidates}</strong>
        </div>
      </section>
      {message && (
        <div className={`form-message ${message.type}`}>{message.text}</div>
      )}
      <div className="module-tabs">
        <button
          className={tab === "jobs" ? "active" : ""}
          onClick={() => setTab("jobs")}
        >
          Job Openings
        </button>
        <button
          className={tab === "candidates" ? "active" : ""}
          onClick={() => setTab("candidates")}
        >
          Candidates
        </button>
        <button
          className={tab === "pipeline" ? "active" : ""}
          onClick={() => setTab("pipeline")}
        >
          Pipeline
        </button>
        <button
          className={tab === "interviews" ? "active" : ""}
          onClick={() => setTab("interviews")}
        >
          Interviews
        </button>
      </div>
      {tab === "jobs" && (
        <section className="content-card">
          <div className="module-card-heading">
            <div>
              <h3>Job Openings</h3>
              <p>Active and historical vacancies</p>
            </div>
            <div className="module-inline-filters">
              <label className="search-box">
                <span>⌕</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search jobs..."
                />
              </label>
              <select
                className="filter-select"
                value={department}
                onChange={(event) => setDepartment(event.target.value)}
              >
                <option value="">All departments</option>
                {departments.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              <select
                className="filter-select"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="">All statuses</option>
                <option>Open</option>
                <option>On Hold</option>
                <option>Closed</option>
              </select>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Department</th>
                  <th>Location</th>
                  <th>Type</th>
                  <th>Vacancies</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((job) => (
                  <tr key={job._id}>
                    <td>
                      <strong>{job.title}</strong>
                      <small>
                        {job.requiredSkills?.join(", ") || "No skills listed"}
                      </small>
                    </td>
                    <td>{job.department}</td>
                    <td>{job.location}</td>
                    <td>{job.employmentType}</td>
                    <td>{job.vacancies}</td>
                    <td>
                      <Status value={job.status} />
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="text-button"
                          onClick={() => openJob(job)}
                        >
                          Edit
                        </button>
                        <button
                          className="text-button danger-text"
                          onClick={() => deleteJob(job)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredJobs.length === 0 && (
                  <tr>
                    <td colSpan="7">
                      <div className="empty-state">
                        <span>⌕</span>
                        <strong>No job openings</strong>
                        <p>Add a job opening to start recruitment.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {tab === "candidates" && (
        <section className="content-card">
          <div className="module-card-heading">
            <div>
              <h3>Candidates</h3>
              <p>Candidate profiles and applications</p>
            </div>
            <button
              className="secondary-button"
              onClick={() => openCandidate()}
            >
              ＋ Add Candidate
            </button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Applied Job</th>
                  <th>Experience</th>
                  <th>Stage</th>
                  <th>Resume</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((candidate) => (
                  <tr key={candidate._id}>
                    <td>
                      <strong>{candidate.name}</strong>
                      <small>{candidate.skills?.join(", ")}</small>
                    </td>
                    <td>{candidate.email}</td>
                    <td>{candidate.appliedJob?.title || "Unknown job"}</td>
                    <td>{candidate.experience} years</td>
                    <td>
                      <select
                        className="filter-select"
                        value={candidate.stage}
                        onChange={(event) =>
                          updateStage(candidate, event.target.value)
                        }
                      >
                        {[
                          "Applied",
                          "Screening",
                          "Shortlisted",
                          "Interview",
                          "Selected",
                          "Rejected",
                        ].map((stage) => (
                          <option key={stage}>{stage}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      {candidate.resume?.storedName ? (
                        <a
                          href={`${API_URL}/recruitment/resumes/${candidate._id}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View Resume
                        </a>
                      ) : (
                        "No resume"
                      )}
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="text-button"
                          onClick={() => openCandidate(candidate)}
                        >
                          Edit
                        </button>
                        <button
                          className="text-button danger-text"
                          onClick={() => deleteCandidate(candidate)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {candidates.length === 0 && (
                  <tr>
                    <td colSpan="7">
                      <div className="empty-state">
                        <span>♙</span>
                        <strong>No candidates</strong>
                        <p>Add a candidate application to begin.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {tab === "pipeline" && (
        <section className="pipeline-grid">
          {[
            "Applied",
            "Screening",
            "Shortlisted",
            "Interview",
            "Selected",
            "Rejected",
          ].map((stage) => (
            <article className="pipeline-column" key={stage}>
              <div className="pipeline-heading">
                <h3>{stage}</h3>
                <span>
                  {
                    candidates.filter((candidate) => candidate.stage === stage)
                      .length
                  }
                </span>
              </div>
              {candidates
                .filter((candidate) => candidate.stage === stage)
                .map((candidate) => (
                  <div className="pipeline-card" key={candidate._id}>
                    <strong>{candidate.name}</strong>
                    <small>
                      {candidate.appliedJob?.title || "Unknown job"}
                    </small>
                    <select
                      className="filter-select"
                      value={candidate.stage}
                      onChange={(event) =>
                        updateStage(candidate, event.target.value)
                      }
                    >
                      {[
                        "Applied",
                        "Screening",
                        "Shortlisted",
                        "Interview",
                        "Selected",
                        "Rejected",
                      ].map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </div>
                ))}
            </article>
          ))}
        </section>
      )}
      {tab === "interviews" && (
        <section className="content-card">
          <div className="module-card-heading">
            <div>
              <h3>Interviews</h3>
              <p>Upcoming and completed interview activity</p>
            </div>
            <button
              className="secondary-button"
              onClick={() => openInterview()}
            >
              ＋ Schedule Interview
            </button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Interviewer</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {interviews.map((interview) => (
                  <tr key={interview._id}>
                    <td>
                      <strong>
                        {interview.candidate?.name || "Unknown candidate"}
                      </strong>
                      <small>{interview.candidate?.appliedJob?.title}</small>
                    </td>
                    <td>{interview.date}</td>
                    <td>{interview.time}</td>
                    <td>{interview.interviewer}</td>
                    <td>{interview.interviewType}</td>
                    <td>
                      <Status value={interview.status} />
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="text-button"
                          onClick={() => openInterview(interview)}
                        >
                          Edit
                        </button>
                        {interview.status !== "Cancelled" && (
                          <button
                            className="text-button"
                            onClick={() =>
                              setInterviewStatus(
                                interview,
                                interview.status === "Scheduled"
                                  ? "Completed"
                                  : "Scheduled",
                              )
                            }
                          >
                            {interview.status === "Scheduled"
                              ? "Complete"
                              : "Reopen"}
                          </button>
                        )}
                        <button
                          className="text-button danger-text"
                          onClick={() =>
                            setInterviewStatus(interview, "Cancelled")
                          }
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {interviews.length === 0 && (
                  <tr>
                    <td colSpan="7">
                      <div className="empty-state">
                        <span>◷</span>
                        <strong>No interviews scheduled</strong>
                        <p>Schedule an interview for a candidate.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {modal === "job" && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingJob ? "Edit Job Opening" : "Add Job Opening"}</h3>
              <IconButton label="Close" onClick={() => setModal(null)}>
                ×
              </IconButton>
            </div>
            <form className="employee-form" onSubmit={saveJob}>
              <label>
                Job Title *
                <input
                  value={jobForm.title}
                  onChange={(event) =>
                    setJobForm({ ...jobForm, title: event.target.value })
                  }
                />
              </label>
              <label>
                Department *
                <input
                  value={jobForm.department}
                  onChange={(event) =>
                    setJobForm({ ...jobForm, department: event.target.value })
                  }
                />
              </label>
              <label>
                Location *
                <input
                  value={jobForm.location}
                  onChange={(event) =>
                    setJobForm({ ...jobForm, location: event.target.value })
                  }
                />
              </label>
              <label>
                Employment Type
                <select
                  value={jobForm.employmentType}
                  onChange={(event) =>
                    setJobForm({
                      ...jobForm,
                      employmentType: event.target.value,
                    })
                  }
                >
                  <option>Full Time</option>
                  <option>Part Time</option>
                  <option>Contract</option>
                  <option>Internship</option>
                </select>
              </label>
              <label>
                Minimum Salary ₹
                <input
                  type="number"
                  min="0"
                  value={jobForm.salaryMin}
                  onChange={(event) =>
                    setJobForm({ ...jobForm, salaryMin: event.target.value })
                  }
                />
              </label>
              <label>
                Maximum Salary ₹
                <input
                  type="number"
                  min="0"
                  value={jobForm.salaryMax}
                  onChange={(event) =>
                    setJobForm({ ...jobForm, salaryMax: event.target.value })
                  }
                />
              </label>
              <label>
                Vacancies
                <input
                  type="number"
                  min="1"
                  value={jobForm.vacancies}
                  onChange={(event) =>
                    setJobForm({ ...jobForm, vacancies: event.target.value })
                  }
                />
              </label>
              <label>
                Status
                <select
                  value={jobForm.status}
                  onChange={(event) =>
                    setJobForm({ ...jobForm, status: event.target.value })
                  }
                >
                  <option>Open</option>
                  <option>On Hold</option>
                  <option>Closed</option>
                </select>
              </label>
              <label className="full-width">
                Required Skills
                <input
                  value={jobForm.requiredSkills}
                  onChange={(event) =>
                    setJobForm({
                      ...jobForm,
                      requiredSkills: event.target.value,
                    })
                  }
                  placeholder="JavaScript, MongoDB, React"
                />
              </label>
              <label className="full-width">
                Job Description *
                <textarea
                  value={jobForm.description}
                  onChange={(event) =>
                    setJobForm({ ...jobForm, description: event.target.value })
                  }
                />
              </label>
              <div className="modal-actions full-width">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => setModal(null)}
                >
                  Cancel
                </button>
                <button className="primary-button" type="submit">
                  Save Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {modal === "candidate" && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingCandidate ? "Edit Candidate" : "Add Candidate"}</h3>
              <IconButton label="Close" onClick={() => setModal(null)}>
                ×
              </IconButton>
            </div>
            <form className="employee-form" onSubmit={saveCandidate}>
              <label>
                Name *
                <input
                  value={candidateForm.name}
                  onChange={(event) =>
                    setCandidateForm({
                      ...candidateForm,
                      name: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                Email *
                <input
                  type="email"
                  value={candidateForm.email}
                  onChange={(event) =>
                    setCandidateForm({
                      ...candidateForm,
                      email: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                Phone *
                <input
                  value={candidateForm.phone}
                  onChange={(event) =>
                    setCandidateForm({
                      ...candidateForm,
                      phone: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                Applied Job *
                <select
                  value={candidateForm.appliedJob}
                  onChange={(event) =>
                    setCandidateForm({
                      ...candidateForm,
                      appliedJob: event.target.value,
                    })
                  }
                >
                  <option value="">Select job</option>
                  {jobs.map((job) => (
                    <option value={job._id} key={job._id}>
                      {job.title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Experience (years)
                <input
                  type="number"
                  min="0"
                  value={candidateForm.experience}
                  onChange={(event) =>
                    setCandidateForm({
                      ...candidateForm,
                      experience: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                Skills
                <input
                  value={candidateForm.skills}
                  onChange={(event) =>
                    setCandidateForm({
                      ...candidateForm,
                      skills: event.target.value,
                    })
                  }
                  placeholder="React, Node.js"
                />
              </label>
              <label className="full-width">
                Resume (PDF, DOC, DOCX - max 5 MB)
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(event) =>
                    setCandidateResume(event.target.files?.[0] || null)
                  }
                />
              </label>
              <div className="modal-actions full-width">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => setModal(null)}
                >
                  Cancel
                </button>
                <button className="primary-button" type="submit">
                  Save Candidate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {modal === "interview" && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>
                {editingInterview ? "Edit Interview" : "Schedule Interview"}
              </h3>
              <IconButton label="Close" onClick={() => setModal(null)}>
                ×
              </IconButton>
            </div>
            <form className="employee-form" onSubmit={saveInterview}>
              <label>
                Candidate *
                <select
                  value={interviewForm.candidate}
                  onChange={(event) =>
                    setInterviewForm({
                      ...interviewForm,
                      candidate: event.target.value,
                    })
                  }
                >
                  <option value="">Select candidate</option>
                  {candidates.map((candidate) => (
                    <option value={candidate._id} key={candidate._id}>
                      {candidate.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Date
                <input
                  type="date"
                  value={interviewForm.date}
                  onChange={(event) =>
                    setInterviewForm({
                      ...interviewForm,
                      date: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                Time
                <input
                  type="time"
                  value={interviewForm.time}
                  onChange={(event) =>
                    setInterviewForm({
                      ...interviewForm,
                      time: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                Interviewer
                <input
                  value={interviewForm.interviewer}
                  onChange={(event) =>
                    setInterviewForm({
                      ...interviewForm,
                      interviewer: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                Interview Type
                <select
                  value={interviewForm.interviewType}
                  onChange={(event) =>
                    setInterviewForm({
                      ...interviewForm,
                      interviewType: event.target.value,
                    })
                  }
                >
                  <option>Video</option>
                  <option>In Person</option>
                  <option>Phone</option>
                </select>
              </label>
              {editingInterview && (
                <label>
                  Status
                  <select
                    value={interviewForm.status || "Scheduled"}
                    onChange={(event) =>
                      setInterviewForm({
                        ...interviewForm,
                        status: event.target.value,
                      })
                    }
                  >
                    <option>Scheduled</option>
                    <option>Completed</option>
                    <option>Cancelled</option>
                  </select>
                </label>
              )}
              <label className="full-width">
                Notes
                <textarea
                  value={interviewForm.notes}
                  onChange={(event) =>
                    setInterviewForm({
                      ...interviewForm,
                      notes: event.target.value,
                    })
                  }
                />
              </label>
              <label className="full-width">
                Feedback
                <textarea
                  value={interviewForm.feedback}
                  onChange={(event) =>
                    setInterviewForm({
                      ...interviewForm,
                      feedback: event.target.value,
                    })
                  }
                />
              </label>
              <div className="modal-actions full-width">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => setModal(null)}
                >
                  Cancel
                </button>
                <button className="primary-button" type="submit">
                  Save Interview
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function Performance() {
  const categoryNames = [
    "Communication",
    "Teamwork",
    "Productivity",
    "Technical Skills",
    "Problem Solving",
  ];
  const emptyGoal = {
    title: "",
    description: "",
    employee: "",
    startDate: "",
    dueDate: "",
    priority: "Medium",
    status: "Not Started",
    progress: 0,
  };
  const emptyReview = {
    employee: "",
    reviewer: "",
    cycleName: "",
    reviewPeriodStart: "",
    reviewPeriodEnd: "",
    categories: categoryNames.map((name) => ({ name, rating: 3 })),
    strengths: "",
    improvements: "",
    comments: "",
  };
  const emptyRecognition = {
    type: "Feedback",
    employee: "",
    reviewer: "",
    feedbackDate: new Date().toISOString().slice(0, 10),
    comments: "",
    achievement: "",
  };
  const [tab, setTab] = useState("dashboard");
  const [employees, setEmployees] = useState([]);
  const [goals, setGoals] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [recognition, setRecognition] = useState([]);
  const [stats, setStats] = useState({
    employeesWithReviews: 0,
    averageRating: 0,
    goalsCompleted: 0,
    goalsInProgress: 0,
    employeeSummaries: [],
  });
  const [goalForm, setGoalForm] = useState(emptyGoal);
  const [reviewForm, setReviewForm] = useState(emptyReview);
  const [recognitionForm, setRecognitionForm] = useState(emptyRecognition);
  const [editingGoal, setEditingGoal] = useState(null);
  const [editingReview, setEditingReview] = useState(null);
  const [modal, setModal] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [goalStatus, setGoalStatus] = useState("");
  const notify = (type, text) => setMessage({ type, text });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = goalStatus
        ? `?status=${encodeURIComponent(goalStatus)}`
        : "";
      const [
        employeesResponse,
        goalsResponse,
        reviewsResponse,
        recognitionResponse,
        dashboardResponse,
      ] = await Promise.all([
        fetch(`${API_URL}/performance/employees`),
        fetch(`${API_URL}/performance/goals${params}`),
        fetch(`${API_URL}/performance/reviews`),
        fetch(`${API_URL}/performance/recognition`),
        fetch(`${API_URL}/performance/dashboard`),
      ]);
      const [
        employeesData,
        goalsData,
        reviewsData,
        recognitionData,
        dashboardData,
      ] = await Promise.all([
        employeesResponse.json(),
        goalsResponse.json(),
        reviewsResponse.json(),
        recognitionResponse.json(),
        dashboardResponse.json(),
      ]);
      if (employeesData.success) setEmployees(employeesData.employees);
      if (goalsData.success) setGoals(goalsData.goals);
      if (reviewsData.success) setReviews(reviewsData.reviews);
      if (recognitionData.success) setRecognition(recognitionData.records);
      if (dashboardData.success) setStats(dashboardData.stats);
    } catch {
      notify("error", "Unable to load performance records.");
    } finally {
      setLoading(false);
    }
  }, [goalStatus]);
  useEffect(() => {
    load();
  }, [load]);

  const openGoal = (goal = null) => {
    setEditingGoal(goal);
    setGoalForm(
      goal
        ? {
            title: goal.title,
            description: goal.description,
            employee: goal.employee?._id || goal.employee,
            startDate: goal.startDate,
            dueDate: goal.dueDate,
            priority: goal.priority,
            status: goal.status,
            progress: goal.progress,
          }
        : emptyGoal,
    );
    setModal("goal");
  };
  const saveGoal = async (event) => {
    event.preventDefault();
    if (
      !goalForm.title ||
      !goalForm.description ||
      !goalForm.employee ||
      !goalForm.startDate ||
      !goalForm.dueDate
    ) {
      notify("error", "Complete all required goal fields.");
      return;
    }
    if (goalForm.dueDate < goalForm.startDate) {
      notify("error", "Due date cannot be before the start date.");
      return;
    }
    try {
      const response = await fetch(
        `${API_URL}/performance/goals${editingGoal ? `/${editingGoal._id}` : ""}`,
        {
          method: editingGoal ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(goalForm),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setModal(null);
      notify("success", editingGoal ? "Goal updated." : "Goal created.");
      load();
    } catch (error) {
      notify("error", error.message);
    }
  };
  const deleteGoal = async (goal) => {
    if (!window.confirm(`Delete goal "${goal.title}"?`)) return;
    try {
      const response = await fetch(`${API_URL}/performance/goals/${goal._id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      notify("success", data.message);
      load();
    } catch (error) {
      notify("error", error.message);
    }
  };
  const openReview = (review = null) => {
    setEditingReview(review);
    setReviewForm(
      review
        ? {
            employee: review.employee?._id || review.employee,
            reviewer: review.reviewer?._id || review.reviewer,
            cycleName: review.cycleName,
            reviewPeriodStart: review.reviewPeriodStart,
            reviewPeriodEnd: review.reviewPeriodEnd,
            categories: categoryNames.map((name) => ({
              name,
              rating:
                review.categories?.find((item) => item.name === name)?.rating ||
                3,
            })),
            strengths: review.strengths || "",
            improvements: review.improvements || "",
            comments: review.comments || "",
          }
        : emptyReview,
    );
    setModal("review");
  };
  const saveReview = async (event) => {
    event.preventDefault();
    if (
      !reviewForm.employee ||
      !reviewForm.reviewer ||
      !reviewForm.cycleName ||
      !reviewForm.reviewPeriodStart ||
      !reviewForm.reviewPeriodEnd
    ) {
      notify("error", "Complete all required review fields.");
      return;
    }
    try {
      const response = await fetch(
        `${API_URL}/performance/reviews${editingReview ? `/${editingReview._id}` : ""}`,
        {
          method: editingReview ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(reviewForm),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setModal(null);
      notify("success", editingReview ? "Review updated." : "Review created.");
      load();
    } catch (error) {
      notify("error", error.message);
    }
  };
  const submitReview = async (review) => {
    if (
      !window.confirm(
        `Submit this review for ${review.employee?.fullName || review.employee?.name || "the employee"}?`,
      )
    )
      return;
    try {
      const response = await fetch(
        `${API_URL}/performance/reviews/${review._id}/submit`,
        { method: "PATCH" },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      notify("success", "Review submitted successfully.");
      load();
    } catch (error) {
      notify("error", error.message);
    }
  };
  const deleteReview = async (review) => {
    if (!window.confirm("Delete this performance review?")) return;
    try {
      const response = await fetch(
        `${API_URL}/performance/reviews/${review._id}`,
        { method: "DELETE" },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      notify("success", data.message);
      load();
    } catch (error) {
      notify("error", error.message);
    }
  };
  const saveRecognition = async (event) => {
    event.preventDefault();
    if (
      !recognitionForm.employee ||
      !recognitionForm.reviewer ||
      !recognitionForm.comments
    ) {
      notify("error", "Select employee, reviewer and add comments.");
      return;
    }
    try {
      const response = await fetch(`${API_URL}/performance/recognition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recognitionForm),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setModal(null);
      setRecognitionForm(emptyRecognition);
      notify("success", `${recognitionForm.type} recorded.`);
      load();
    } catch (error) {
      notify("error", error.message);
    }
  };
  const deleteRecognition = async (record) => {
    if (!window.confirm("Delete this feedback or recognition record?")) return;
    try {
      const response = await fetch(
        `${API_URL}/performance/recognition/${record._id}`,
        { method: "DELETE" },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      notify("success", data.message);
      load();
    } catch (error) {
      notify("error", error.message);
    }
  };
  const employeeName = (employee) =>
    employee?.fullName || employee?.name || "Unknown employee";

  return (
    <>
      <PageHeader
        title="Performance Management"
        subtitle="Manage goals, reviews, feedback and recognition."
      />
      <section className="mini-stats">
        <div>
          <span>Total Employees with Reviews</span>
          <strong>{loading ? "..." : stats.employeesWithReviews}</strong>
        </div>
        <div>
          <span>Average Performance Rating</span>
          <strong>{loading ? "..." : stats.averageRating.toFixed(1)}</strong>
        </div>
        <div>
          <span>Goals Completed</span>
          <strong>{loading ? "..." : stats.goalsCompleted}</strong>
        </div>
        <div>
          <span>Goals In Progress</span>
          <strong>{loading ? "..." : stats.goalsInProgress}</strong>
        </div>
      </section>
      {message && (
        <div className={`form-message ${message.type}`}>{message.text}</div>
      )}
      <div className="module-tabs">
        <button
          className={tab === "dashboard" ? "active" : ""}
          onClick={() => setTab("dashboard")}
        >
          Dashboard
        </button>
        <button
          className={tab === "goals" ? "active" : ""}
          onClick={() => setTab("goals")}
        >
          Goals
        </button>
        <button
          className={tab === "reviews" ? "active" : ""}
          onClick={() => setTab("reviews")}
        >
          Reviews
        </button>
        <button
          className={tab === "recognition" ? "active" : ""}
          onClick={() => setTab("recognition")}
        >
          Feedback & Recognition
        </button>
      </div>
      {tab === "dashboard" && (
        <>
          <section className="content-card">
            <div className="card-heading">
              <div>
                <h3>Employee Performance Summary</h3>
                <p>Submitted review averages</p>
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Average Rating</th>
                    <th>Review Records</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.employeeSummaries.map((summary) => (
                    <tr key={summary.employee._id}>
                      <td>{employeeName(summary.employee)}</td>
                      <td>{summary.employee.department || "-"}</td>
                      <td>
                        <strong>{summary.average.toFixed(1)} / 5</strong>
                      </td>
                      <td>
                        {summary.ratings.length
                          ? Math.ceil(summary.ratings.length / 5)
                          : 0}
                      </td>
                    </tr>
                  ))}
                  {stats.employeeSummaries.length === 0 && (
                    <tr>
                      <td colSpan="4">
                        <div className="empty-state">
                          <span>↗</span>
                          <strong>No submitted performance reviews</strong>
                          <p>Submit a review to populate employee summaries.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
      {tab === "goals" && (
        <section className="content-card">
          <div className="module-card-heading">
            <div>
              <h3>Performance Goals</h3>
              <p>Individual employee objectives</p>
            </div>
            <div className="module-inline-filters">
              <select
                className="filter-select"
                value={goalStatus}
                onChange={(event) => setGoalStatus(event.target.value)}
              >
                <option value="">All statuses</option>
                <option>Not Started</option>
                <option>In Progress</option>
                <option>Completed</option>
              </select>
              <button className="secondary-button" onClick={() => openGoal()}>
                ＋ Add Goal
              </button>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Goal</th>
                  <th>Employee</th>
                  <th>Due Date</th>
                  <th>Priority</th>
                  <th>Progress</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {goals.map((goal) => (
                  <tr key={goal._id}>
                    <td>
                      <strong>{goal.title}</strong>
                      <small>{goal.description}</small>
                    </td>
                    <td>{employeeName(goal.employee)}</td>
                    <td>{goal.dueDate}</td>
                    <td>
                      <Status value={goal.priority} />
                    </td>
                    <td>
                      <div className="progress-wrap">
                        <div>
                          <span style={{ width: `${goal.progress}%` }} />
                        </div>
                        <small>{goal.progress}%</small>
                      </div>
                    </td>
                    <td>
                      <Status value={goal.status} />
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="text-button"
                          onClick={() => openGoal(goal)}
                        >
                          Edit
                        </button>
                        <button
                          className="text-button danger-text"
                          onClick={() => deleteGoal(goal)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {goals.length === 0 && (
                  <tr>
                    <td colSpan="7">
                      <div className="empty-state">
                        <span>◎</span>
                        <strong>No performance goals</strong>
                        <p>Create the first employee goal.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {tab === "reviews" && (
        <section className="content-card">
          <div className="module-card-heading">
            <div>
              <h3>Performance Reviews</h3>
              <p>Review cycles and submitted ratings</p>
            </div>
            <button className="secondary-button" onClick={() => openReview()}>
              ＋ Create Review
            </button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Reviewer</th>
                  <th>Review Cycle</th>
                  <th>Period</th>
                  <th>Average</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review) => {
                  const average = review.categories?.length
                    ? review.categories.reduce(
                        (sum, item) => sum + item.rating,
                        0,
                      ) / review.categories.length
                    : 0;
                  return (
                    <tr key={review._id}>
                      <td>{employeeName(review.employee)}</td>
                      <td>{employeeName(review.reviewer)}</td>
                      <td>{review.cycleName}</td>
                      <td>
                        {review.reviewPeriodStart} to {review.reviewPeriodEnd}
                      </td>
                      <td>
                        <strong>{average.toFixed(1)} / 5</strong>
                      </td>
                      <td>
                        <Status value={review.status} />
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="text-button"
                            onClick={() => openReview(review)}
                          >
                            Edit
                          </button>
                          {review.status !== "Submitted" && (
                            <button
                              className="text-button"
                              onClick={() => submitReview(review)}
                            >
                              Submit
                            </button>
                          )}
                          <button
                            className="text-button danger-text"
                            onClick={() => deleteReview(review)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {reviews.length === 0 && (
                  <tr>
                    <td colSpan="7">
                      <div className="empty-state">
                        <span>▤</span>
                        <strong>No performance reviews</strong>
                        <p>Create a review cycle to begin.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {tab === "recognition" && (
        <section className="content-card">
          <div className="module-card-heading">
            <div>
              <h3>Feedback and Recognition</h3>
              <p>Manager feedback and employee achievements</p>
            </div>
            <button
              className="secondary-button"
              onClick={() => {
                setRecognitionForm(emptyRecognition);
                setModal("recognition");
              }}
            >
              ＋ Add Feedback
            </button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Employee</th>
                  <th>Reviewer</th>
                  <th>Comments / Achievement</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recognition.map((record) => (
                  <tr key={record._id}>
                    <td>{record.feedbackDate}</td>
                    <td>
                      <Status value={record.type} />
                    </td>
                    <td>{employeeName(record.employee)}</td>
                    <td>{employeeName(record.reviewer)}</td>
                    <td>
                      <strong>{record.achievement || "-"}</strong>
                      <small>{record.comments}</small>
                    </td>
                    <td>
                      <button
                        className="text-button danger-text"
                        onClick={() => deleteRecognition(record)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {recognition.length === 0 && (
                  <tr>
                    <td colSpan="6">
                      <div className="empty-state">
                        <span>★</span>
                        <strong>No feedback or recognition records</strong>
                        <p>Add the first record.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {modal === "goal" && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>
                {editingGoal
                  ? "Edit Performance Goal"
                  : "Create Performance Goal"}
              </h3>
              <IconButton label="Close" onClick={() => setModal(null)}>
                ×
              </IconButton>
            </div>
            <form className="employee-form" onSubmit={saveGoal}>
              <label>
                Goal Title *
                <input
                  value={goalForm.title}
                  onChange={(event) =>
                    setGoalForm({ ...goalForm, title: event.target.value })
                  }
                />
              </label>
              <label>
                Assigned Employee *
                <select
                  value={goalForm.employee}
                  onChange={(event) =>
                    setGoalForm({ ...goalForm, employee: event.target.value })
                  }
                >
                  <option value="">Select employee</option>
                  {employees.map((employee) => (
                    <option value={employee._id} key={employee._id}>
                      {employeeName(employee)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Start Date *
                <input
                  type="date"
                  value={goalForm.startDate}
                  onChange={(event) =>
                    setGoalForm({ ...goalForm, startDate: event.target.value })
                  }
                />
              </label>
              <label>
                Due Date *
                <input
                  type="date"
                  value={goalForm.dueDate}
                  onChange={(event) =>
                    setGoalForm({ ...goalForm, dueDate: event.target.value })
                  }
                />
              </label>
              <label>
                Priority
                <select
                  value={goalForm.priority}
                  onChange={(event) =>
                    setGoalForm({ ...goalForm, priority: event.target.value })
                  }
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </label>
              <label>
                Status
                <select
                  value={goalForm.status}
                  onChange={(event) =>
                    setGoalForm({
                      ...goalForm,
                      status: event.target.value,
                      progress:
                        event.target.value === "Completed"
                          ? 100
                          : goalForm.progress,
                    })
                  }
                >
                  <option>Not Started</option>
                  <option>In Progress</option>
                  <option>Completed</option>
                </select>
              </label>
              <label className="full-width">
                Progress{" "}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={goalForm.progress}
                  onChange={(event) =>
                    setGoalForm({
                      ...goalForm,
                      progress: Number(event.target.value),
                    })
                  }
                />
                <small>{goalForm.progress}%</small>
              </label>
              <label className="full-width">
                Description *
                <textarea
                  value={goalForm.description}
                  onChange={(event) =>
                    setGoalForm({
                      ...goalForm,
                      description: event.target.value,
                    })
                  }
                />
              </label>
              <div className="modal-actions full-width">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => setModal(null)}
                >
                  Cancel
                </button>
                <button className="primary-button" type="submit">
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {modal === "review" && (
        <div className="modal-backdrop">
          <div className="modal performance-review-modal">
            <div className="modal-header">
              <h3>
                {editingReview
                  ? "Edit Performance Review"
                  : "Create Performance Review"}
              </h3>
              <IconButton label="Close" onClick={() => setModal(null)}>
                ×
              </IconButton>
            </div>
            <form className="employee-form" onSubmit={saveReview}>
              <label>
                Employee *
                <select
                  value={reviewForm.employee}
                  disabled={Boolean(editingReview)}
                  onChange={(event) =>
                    setReviewForm({
                      ...reviewForm,
                      employee: event.target.value,
                    })
                  }
                >
                  <option value="">Select employee</option>
                  {employees.map((employee) => (
                    <option value={employee._id} key={employee._id}>
                      {employeeName(employee)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Reviewer *
                <select
                  value={reviewForm.reviewer}
                  onChange={(event) =>
                    setReviewForm({
                      ...reviewForm,
                      reviewer: event.target.value,
                    })
                  }
                >
                  <option value="">Select reviewer</option>
                  {employees.map((employee) => (
                    <option value={employee._id} key={employee._id}>
                      {employeeName(employee)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Review Cycle *
                <input
                  value={reviewForm.cycleName}
                  onChange={(event) =>
                    setReviewForm({
                      ...reviewForm,
                      cycleName: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                Period Start *
                <input
                  type="date"
                  value={reviewForm.reviewPeriodStart}
                  onChange={(event) =>
                    setReviewForm({
                      ...reviewForm,
                      reviewPeriodStart: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                Period End *
                <input
                  type="date"
                  value={reviewForm.reviewPeriodEnd}
                  onChange={(event) =>
                    setReviewForm({
                      ...reviewForm,
                      reviewPeriodEnd: event.target.value,
                    })
                  }
                />
              </label>
              <div className="rating-grid">
                {reviewForm.categories.map((category, index) => (
                  <label key={category.name}>
                    {category.name}
                    <select
                      value={category.rating}
                      onChange={(event) =>
                        setReviewForm({
                          ...reviewForm,
                          categories: reviewForm.categories.map(
                            (item, itemIndex) =>
                              itemIndex === index
                                ? {
                                    ...item,
                                    rating: Number(event.target.value),
                                  }
                                : item,
                          ),
                        })
                      }
                    >
                      <option value="1">1 - Poor</option>
                      <option value="2">2 - Needs Improvement</option>
                      <option value="3">3 - Meets Expectations</option>
                      <option value="4">4 - Good</option>
                      <option value="5">5 - Excellent</option>
                    </select>
                  </label>
                ))}
              </div>
              <label className="full-width">
                Strengths
                <textarea
                  value={reviewForm.strengths}
                  onChange={(event) =>
                    setReviewForm({
                      ...reviewForm,
                      strengths: event.target.value,
                    })
                  }
                />
              </label>
              <label className="full-width">
                Areas for Improvement
                <textarea
                  value={reviewForm.improvements}
                  onChange={(event) =>
                    setReviewForm({
                      ...reviewForm,
                      improvements: event.target.value,
                    })
                  }
                />
              </label>
              <label className="full-width">
                Reviewer Comments
                <textarea
                  value={reviewForm.comments}
                  onChange={(event) =>
                    setReviewForm({
                      ...reviewForm,
                      comments: event.target.value,
                    })
                  }
                />
              </label>
              <div className="modal-actions full-width">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => setModal(null)}
                >
                  Cancel
                </button>
                <button className="primary-button" type="submit">
                  Save Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {modal === "recognition" && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>Add Feedback or Recognition</h3>
              <IconButton label="Close" onClick={() => setModal(null)}>
                ×
              </IconButton>
            </div>
            <form className="employee-form" onSubmit={saveRecognition}>
              <label>
                Type
                <select
                  value={recognitionForm.type}
                  onChange={(event) =>
                    setRecognitionForm({
                      ...recognitionForm,
                      type: event.target.value,
                    })
                  }
                >
                  <option>Feedback</option>
                  <option>Recognition</option>
                </select>
              </label>
              <label>
                Date
                <input
                  type="date"
                  value={recognitionForm.feedbackDate}
                  onChange={(event) =>
                    setRecognitionForm({
                      ...recognitionForm,
                      feedbackDate: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                Employee *
                <select
                  value={recognitionForm.employee}
                  onChange={(event) =>
                    setRecognitionForm({
                      ...recognitionForm,
                      employee: event.target.value,
                    })
                  }
                >
                  <option value="">Select employee</option>
                  {employees.map((employee) => (
                    <option value={employee._id} key={employee._id}>
                      {employeeName(employee)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Reviewer *
                <select
                  value={recognitionForm.reviewer}
                  onChange={(event) =>
                    setRecognitionForm({
                      ...recognitionForm,
                      reviewer: event.target.value,
                    })
                  }
                >
                  <option value="">Select reviewer</option>
                  {employees.map((employee) => (
                    <option value={employee._id} key={employee._id}>
                      {employeeName(employee)}
                    </option>
                  ))}
                </select>
              </label>
              {recognitionForm.type === "Recognition" && (
                <label className="full-width">
                  Achievement
                  <input
                    value={recognitionForm.achievement}
                    onChange={(event) =>
                      setRecognitionForm({
                        ...recognitionForm,
                        achievement: event.target.value,
                      })
                    }
                  />
                </label>
              )}
              <label className="full-width">
                Comments *
                <textarea
                  value={recognitionForm.comments}
                  onChange={(event) =>
                    setRecognitionForm({
                      ...recognitionForm,
                      comments: event.target.value,
                    })
                  }
                />
              </label>
              <div className="modal-actions full-width">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => setModal(null)}
                >
                  Cancel
                </button>
                <button className="primary-button" type="submit">
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function SettingsPage({ account, initialSection }) {
  const [notifications, setNotifications] = useState(true);
  const [weekly, setWeekly] = useState(true);
  const [birthdaySettings, setBirthdaySettings] = useState({
    subject: "Happy Birthday, {employeeName}!",
    message:
      "Wishing you a very Happy Birthday! May your day be filled with happiness, success and wonderful memories.",
    enabled: true,
  });
  const [smtpConfigured, setSmtpConfigured] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [employees, setEmployees] = useState([]);
  const [manualEmployeeId, setManualEmployeeId] = useState("");
  const [manualSending, setManualSending] = useState(false);
  const [manualAnniversaryEmployeeId, setManualAnniversaryEmployeeId] =
    useState("");
  const [manualAnniversarySending, setManualAnniversarySending] =
    useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/birthday/settings`)
      .then((response) => response.json())
      .then((data) => {
        if (data.settings) setBirthdaySettings(data.settings);
        setSmtpConfigured(data.smtpConfigured);
      })
      .catch(() =>
        setMessage({
          type: "error",
          message: "Unable to load birthday settings.",
        }),
      );
    fetch(`${API_URL}/employees?status=active`)
      .then((response) => response.json())
      .then((data) => {
        setEmployees(data.employees || []);
      })
      .catch(() =>
        setMessage({
          type: "error",
          message: "Unable to load employees for manual testing.",
        }),
      );
  }, []);

  useEffect(() => {
    if (!initialSection) return;
    const timer = window.setTimeout(() => {
      document
        .getElementById(initialSection)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    return () => window.clearTimeout(timer);
  }, [initialSection]);

  const saveSettings = async () => {
    try {
      const response = await fetch(`${API_URL}/birthday/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(birthdaySettings),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Unable to save settings.");
      setMessage({
        type: "success",
        message: "Birthday email settings saved.",
      });
    } catch (error) {
      setMessage({ type: "error", message: error.message });
    }
  };

  const sendTest = async () => {
    try {
      const response = await fetch(`${API_URL}/birthday/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmail }),
      });
      const data = await response.json();
      setMessage({
        type: response.ok ? "success" : "error",
        message: data.message,
      });
    } catch (error) {
      setMessage({ type: "error", message: error.message });
    }
  };

  const sendManualBirthdayTest = async () => {
    if (!manualEmployeeId) {
      setMessage({ type: "error", message: "Select a test employee." });
      return;
    }
    setManualSending(true);
    try {
      const response = await fetch(`${API_URL}/birthday/manual-test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: manualEmployeeId }),
      });
      const data = await response.json();
      setMessage({
        type: response.ok ? "success" : "error",
        message: data.message,
      });
    } catch (error) {
      setMessage({ type: "error", message: error.message });
    } finally {
      setManualSending(false);
    }
  };

  const sendManualWorkAnniversaryTest = async () => {
    if (!manualAnniversaryEmployeeId) {
      setMessage({
        type: "error",
        message: "Select a work anniversary test employee.",
      });
      return;
    }
    setManualAnniversarySending(true);
    try {
      const response = await fetch(`${API_URL}/work-anniversary/manual-test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: manualAnniversaryEmployeeId }),
      });
      const data = await response.json();
      setMessage({
        type: response.ok ? "success" : "error",
        message: data.message,
      });
    } catch (error) {
      setMessage({ type: "error", message: error.message });
    } finally {
      setManualAnniversarySending(false);
    }
  };

  const runNow = async () => {
    try {
      const response = await fetch(`${API_URL}/birthday/run`, {
        method: "POST",
      });
      const data = await response.json();
      setMessage({
        type: response.ok ? "success" : "error",
        message: data.message,
      });
    } catch (error) {
      setMessage({ type: "error", message: error.message });
    }
  };

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Configure workspace preferences and organization details."
      />
      {message && (
        <div className={`notification-toast ${message.type}`}>
          <span>{message.type === "success" ? "✓" : "!"}</span>
          {message.message}
        </div>
      )}
      <section className="settings-grid">
        <article className="content-card" id="admin-profile">
          <h3>Admin Profile</h3>
          <div className="settings-form">
            <label>
              Admin Name
              <input value={account?.fullName || "SmartHR Admin"} readOnly />
            </label>
            <label>
              Work Email
              <input value={account?.email || ""} readOnly />
            </label>
            <label>
              Role
              <input value="HR Administrator" readOnly />
            </label>
          </div>
        </article>
        <article className="content-card" id="account-settings">
          <h3>Account Settings</h3>
          <div className="settings-form">
            <label>
              Organization Name
              <input value="SmartHR" readOnly />
            </label>
            <label>
              Time Zone
              <select defaultValue="Asia/Kolkata">
                <option>Asia/Kolkata</option>
              </select>
            </label>
            <div className="toggle-row">
              <div>
                <strong>Email Notifications</strong>
                <p>Application email automation preferences</p>
              </div>
              <button
                className={`toggle ${notifications ? "on" : ""}`}
                type="button"
                aria-label="Toggle email notifications"
                aria-pressed={notifications}
                onClick={() => setNotifications(!notifications)}
              >
                <span />
              </button>
            </div>
            <div className="toggle-row">
              <div>
                <strong>Weekly Summary</strong>
                <p>Receive a weekly HR summary</p>
              </div>
              <button
                className={`toggle ${weekly ? "on" : ""}`}
                type="button"
                aria-label="Toggle weekly summary"
                aria-pressed={weekly}
                onClick={() => setWeekly(!weekly)}
              >
                <span />
              </button>
            </div>
          </div>
        </article>
        <article className="content-card">
          <h3>Birthday Email Automation</h3>
          <div className="settings-form">
            <label>
              Email Subject
              <input
                value={birthdaySettings.subject}
                onChange={(event) =>
                  setBirthdaySettings({
                    ...birthdaySettings,
                    subject: event.target.value,
                  })
                }
              />
            </label>
            <label>
              Birthday Message
              <textarea
                value={birthdaySettings.message}
                onChange={(event) =>
                  setBirthdaySettings({
                    ...birthdaySettings,
                    message: event.target.value,
                  })
                }
              />
            </label>
            <div className="toggle-row">
              <div>
                <strong>Enable automation</strong>
                <p>Scheduled daily at 12:01 AM Asia/Kolkata</p>
              </div>
              <button
                className={`toggle ${birthdaySettings.enabled ? "on" : ""}`}
                type="button"
                onClick={() =>
                  setBirthdaySettings({
                    ...birthdaySettings,
                    enabled: !birthdaySettings.enabled,
                  })
                }
              >
                <span />
              </button>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                className="primary-button"
                type="button"
                onClick={saveSettings}
              >
                Save Email Settings
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={runNow}
              >
                Run Check Now
              </button>
            </div>
          </div>
        </article>
        <article className="content-card">
          <h3>SMTP Test</h3>
          <div className="settings-form">
            <p>
              {smtpConfigured
                ? "SMTP credentials are configured."
                : "SMTP is not configured. Add credentials to backend/.env."}
            </p>
            <label>
              Test Recipient
              <input
                type="email"
                value={testEmail}
                onChange={(event) => setTestEmail(event.target.value)}
                placeholder="hr@example.com"
              />
            </label>
            <button className="primary-button" type="button" onClick={sendTest}>
              Send Test Email
            </button>
          </div>
        </article>
        <article className="content-card">
          <h3>Manual Birthday Email Test</h3>
          <div className="settings-form">
            <p>
              Select one employee to send an immediate birthday test email. No
              other employees will receive an email.
            </p>
            <label>
              Test Employee
              <select
                value={manualEmployeeId}
                onChange={(event) => setManualEmployeeId(event.target.value)}
              >
                <option value="">Select employee</option>
                {employees.map((employee) => (
                  <option key={employee._id} value={employee._id}>
                    {employee.fullName || employee.name || employee.email}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="primary-button"
              type="button"
              disabled={manualSending}
              onClick={sendManualBirthdayTest}
            >
              {manualSending ? "Sending..." : "Send Birthday Test Email"}
            </button>
          </div>
        </article>
        <article className="content-card">
          <h3>Manual Work Anniversary Email Test</h3>
          <div className="settings-form">
            <p>
              Select one employee to send an immediate work anniversary test
              email. No other employees will receive an email.
            </p>
            <label>
              Test Employee
              <select
                value={manualAnniversaryEmployeeId}
                onChange={(event) =>
                  setManualAnniversaryEmployeeId(event.target.value)
                }
              >
                <option value="">Select employee</option>
                {employees.map((employee) => (
                  <option key={employee._id} value={employee._id}>
                    {employee.fullName || employee.name || employee.email}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="primary-button"
              type="button"
              disabled={manualAnniversarySending}
              onClick={sendManualWorkAnniversaryTest}
            >
              {manualAnniversarySending
                ? "Sending..."
                : "Send Work Anniversary Test Email"}
            </button>
          </div>
        </article>
      </section>
    </>
  );
}

const ACCOUNT_KEY = "smarthr_demo_account";
const SESSION_KEY = "smarthr_demo_session";

function AuthPage({ onLogin }) {
  const [view, setView] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [message, setMessage] = useState(null);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});

  const emailIsValid = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const switchView = (nextView) => {
    setView(nextView);
    setErrors({});
    setMessage(null);
  };

  const handleLogin = (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!loginForm.email.trim())
      nextErrors.email = "Email address is required.";
    else if (!emailIsValid(loginForm.email))
      nextErrors.email = "Enter a valid email address.";
    if (!loginForm.password) nextErrors.password = "Password is required.";
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    const account = JSON.parse(localStorage.getItem(ACCOUNT_KEY) || "null");
    if (
      !account ||
      account.email.toLowerCase() !== loginForm.email.trim().toLowerCase() ||
      account.password !== loginForm.password
    ) {
      setErrors({
        general:
          "Invalid email or password. Create a new account if you do not have one.",
      });
      return;
    }
    const session = JSON.stringify({
      fullName: account.fullName,
      email: account.email,
    });
    if (remember) localStorage.setItem(SESSION_KEY, session);
    else sessionStorage.setItem(SESSION_KEY, session);
    setErrors({});
    onLogin({ fullName: account.fullName, email: account.email });
  };

  const handleSignup = (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!signupForm.fullName.trim())
      nextErrors.fullName = "Full name is required.";
    if (!signupForm.email.trim()) nextErrors.email = "Work email is required.";
    else if (!emailIsValid(signupForm.email))
      nextErrors.email = "Enter a valid email address.";
    if (!signupForm.password) nextErrors.password = "Password is required.";
    else if (signupForm.password.length < 6)
      nextErrors.password = "Password must be at least 6 characters.";
    if (!signupForm.confirmPassword)
      nextErrors.confirmPassword = "Please confirm your password.";
    else if (signupForm.password !== signupForm.confirmPassword)
      nextErrors.confirmPassword = "Passwords do not match.";
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    const account = {
      fullName: signupForm.fullName.trim(),
      email: signupForm.email.trim(),
      password: signupForm.password,
    };
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
    setSignupForm({
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
    setErrors({});
    setLoginForm({ email: account.email, password: "" });
    setView("login");
    setMessage({
      type: "success",
      text: "Account created successfully. You can now log in.",
    });
  };

  return (
    <main className="auth-page">
      <section className="auth-brand-panel">
        <div className="auth-brand">
          <span className="brand-mark">S</span>
          <strong>SmartHR</strong>
        </div>
        <div className="auth-brand-content">
          <span className="auth-kicker">People operations, simplified</span>
          <h1>Manage your team with confidence.</h1>
          <p>
            A single workspace for employees, attendance, leave, payroll, and
            performance.
          </p>
        </div>
        <div className="auth-decoration decoration-one" />
        <div className="auth-decoration decoration-two" />
      </section>
      <section className="auth-form-panel">
        <div className="auth-form-card">
          {message && (
            <div className={`auth-message ${message.type}`}>{message.text}</div>
          )}
          {view === "login" ? (
            <>
              <div className="auth-heading">
                <span>Welcome back</span>
                <h2>Sign in to SmartHR</h2>
                <p>Enter your account details to continue.</p>
              </div>
              <form className="auth-form" onSubmit={handleLogin} noValidate>
                {errors.general && (
                  <div className="auth-error general">{errors.general}</div>
                )}
                <label>
                  Email address
                  <input
                    type="email"
                    value={loginForm.email}
                    onChange={(e) =>
                      setLoginForm({ ...loginForm, email: e.target.value })
                    }
                    placeholder="name@company.com"
                    aria-invalid={Boolean(errors.email)}
                  />
                  <small>{errors.email}</small>
                </label>
                <label>
                  Password
                  <div className="password-field">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={loginForm.password}
                      onChange={(e) =>
                        setLoginForm({ ...loginForm, password: e.target.value })
                      }
                      placeholder="Enter your password"
                      aria-invalid={Boolean(errors.password)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <small>{errors.password}</small>
                </label>
                <div className="auth-options">
                  <label className="remember-option">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                    />
                    Remember me
                  </label>
                  <button
                    type="button"
                    className="auth-link-button"
                    onClick={() =>
                      setMessage({
                        type: "info",
                        text: "Password recovery will be available after backend authentication is connected.",
                      })
                    }
                  >
                    Forgot password?
                  </button>
                </div>
                <button className="auth-submit" type="submit">
                  Login
                </button>
              </form>
              <p className="auth-switch">
                New to SmartHR?{" "}
                <button type="button" onClick={() => switchView("signup")}>
                  Create New Account
                </button>
              </p>
            </>
          ) : (
            <>
              <div className="auth-heading">
                <span>Create account</span>
                <h2>Start with SmartHR</h2>
                <p>Set up your demonstration account.</p>
              </div>
              <form className="auth-form" onSubmit={handleSignup} noValidate>
                <label>
                  Full Name
                  <input
                    value={signupForm.fullName}
                    onChange={(e) =>
                      setSignupForm({ ...signupForm, fullName: e.target.value })
                    }
                    placeholder="Your full name"
                    aria-invalid={Boolean(errors.fullName)}
                  />
                  <small>{errors.fullName}</small>
                </label>
                <label>
                  Work Email
                  <input
                    type="email"
                    value={signupForm.email}
                    onChange={(e) =>
                      setSignupForm({ ...signupForm, email: e.target.value })
                    }
                    placeholder="name@company.com"
                    aria-invalid={Boolean(errors.email)}
                  />
                  <small>{errors.email}</small>
                </label>
                <label>
                  Password
                  <div className="password-field">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={signupForm.password}
                      onChange={(e) =>
                        setSignupForm({
                          ...signupForm,
                          password: e.target.value,
                        })
                      }
                      placeholder="Create a password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <small>{errors.password}</small>
                </label>
                <label>
                  Confirm Password
                  <div className="password-field">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={signupForm.confirmPassword}
                      onChange={(e) =>
                        setSignupForm({
                          ...signupForm,
                          confirmPassword: e.target.value,
                        })
                      }
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <small>{errors.confirmPassword}</small>
                </label>
                <button className="auth-submit" type="submit">
                  Create Account
                </button>
              </form>
              <p className="auth-switch">
                Already have an account?{" "}
                <button type="button" onClick={() => switchView("login")}>
                  Login
                </button>
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

function DashboardApp({ account, onLogout }) {
  const [active, setActive] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [settingsSection, setSettingsSection] = useState("");
  const [dashboardNotifications, setDashboardNotifications] = useState(null);
  const profileRef = useRef(null);
  const notificationsRef = useRef(null);

  const notificationStorageKey = `smarthr_read_notifications_${String(account?.email || "admin").toLowerCase()}`;

  const getReadNotifications = () => {
    try {
      return new Set(
        JSON.parse(localStorage.getItem(notificationStorageKey) || "[]"),
      );
    } catch {
      return new Set();
    }
  };

  const loadNotifications = useCallback(() => {
    fetch(`${API_URL}/birthday/dashboard`)
      .then((response) => response.json())
      .then((data) => {
        if (data.success) setDashboardNotifications(data.stats);
      })
      .catch(() => setDashboardNotifications(null));
  }, []);

  useEffect(() => {
    const closeOnDesktop = () => {
      if (window.innerWidth > 760) setSidebarOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setSidebarOpen(false);
        setProfileOpen(false);
        setNotificationsOpen(false);
      }
    };
    const closeOnOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target))
        setProfileOpen(false);
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      )
        setNotificationsOpen(false);
    };
    window.addEventListener("resize", closeOnDesktop);
    window.addEventListener("keydown", closeOnEscape);
    document.addEventListener("mousedown", closeOnOutside);
    return () => {
      window.removeEventListener("resize", closeOnDesktop);
      window.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("mousedown", closeOnOutside);
    };
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const notificationItems = useMemo(() => {
    const items = [];
    const stats = dashboardNotifications;
    if (!stats) return items;
    if (stats.todayBirthdays > 0) {
      items.push({
        id: "today-birthdays",
        title: `${stats.todayBirthdays} birthday${stats.todayBirthdays === 1 ? "" : "s"} today`,
        detail: "Employee birthday milestone available on the dashboard.",
        type: "birthday",
      });
    }
    if (stats.todayWorkAnniversaries > 0) {
      items.push({
        id: "today-work-anniversaries",
        title: `${stats.todayWorkAnniversaries} work anniversary milestone${stats.todayWorkAnniversaries === 1 ? "" : "s"} today`,
        detail:
          "A 1st, 3rd, or 5th work anniversary is available on the dashboard.",
        type: "anniversary",
      });
    }
    (stats.logs || [])
      .filter((log) => log.status === "failed")
      .forEach((log) => {
        items.push({
          id: `email-failed-${log._id}`,
          title: `${log.emailType === "work-anniversary" ? "Work anniversary" : "Birthday"} email failed`,
          detail: log.error || `Delivery to ${log.recipientEmail} failed.`,
          type: "error",
          date: log.createdAt,
        });
      });
    return items;
  }, [dashboardNotifications]);

  const unreadIds = notificationItems
    .filter((item) => !getReadNotifications().has(item.id))
    .map((item) => item.id);

  const markAllNotificationsRead = () => {
    localStorage.setItem(
      notificationStorageKey,
      JSON.stringify(notificationItems.map((item) => item.id)),
    );
    setDashboardNotifications((current) =>
      current ? { ...current } : current,
    );
  };

  const markNotificationRead = (itemId) => {
    const readIds = getReadNotifications();
    readIds.add(itemId);
    localStorage.setItem(notificationStorageKey, JSON.stringify([...readIds]));
    setDashboardNotifications((current) =>
      current ? { ...current } : current,
    );
  };

  const openSettingsSection = (section) => {
    setSettingsSection(section);
    setActive("Settings");
    setProfileOpen(false);
  };

  const pages = {
    Dashboard: <Dashboard />,
    "Employee Management": <EmployeeManagement />,
    LegacyEmployeeManagement: <LegacyEmployeeManagement />,
    "Attendance Management": <Attendance />,
    "Leave Management": <Leave />,
    "Payroll Management": <Payroll />,
    "Recruitment Management": <Recruitment />,
    "Performance Management": <Performance />,
    Settings: (
      <SettingsPage account={account} initialSection={settingsSection} />
    ),
  };

  return (
    <div className="app-shell">
      {sidebarOpen && (
        <button
          className="sidebar-overlay"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <button
          className="brand"
          type="button"
          onClick={() => {
            setActive("Dashboard");
            setSidebarOpen(false);
          }}
        >
          <span className="brand-mark">S</span>
          <span>SmartHR</span>
        </button>
        <nav>
          {navItems.map(([label, icon]) => (
            <button
              type="button"
              key={label}
              className={`nav-item ${active === label ? "active" : ""}`}
              onClick={() => {
                setActive(label);
                setSidebarOpen(false);
              }}
            >
              <span className="nav-icon">{icon}</span>
              <span>{label.replace(" Management", "")}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-profile">
          <span className="avatar">
            {initials(account.fullName || account.email)}
          </span>
          <div>
            <strong>{account.fullName || "SmartHR User"}</strong>
            <small>HR Administrator</small>
          </div>
          <button
            type="button"
            aria-label="Logout"
            title="Logout"
            onClick={onLogout}
          >
            ⏻
          </button>
        </div>
      </aside>
      <main className="main-content">
        <div className="topbar">
          <button
            className="menu-button"
            type="button"
            aria-label="Open menu"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>
          <label className="global-search">
            <span>⌕</span>
            <input placeholder="Search employees, reports..." />
          </label>
          <div className="topbar-actions">
            <div className="notification-control" ref={notificationsRef}>
              <button
                type="button"
                className="notification-button"
                aria-label={`Notifications${unreadIds.length ? `, ${unreadIds.length} unread` : ", no unread notifications"}`}
                aria-expanded={notificationsOpen}
                aria-haspopup="menu"
                onClick={() => {
                  setProfileOpen(false);
                  setNotificationsOpen((current) => !current);
                  loadNotifications();
                }}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setNotificationsOpen(true);
                  }
                }}
              >
                <span aria-hidden="true">♢</span>
                {unreadIds.length > 0 && (
                  <b className="notification-count" aria-hidden="true">
                    {unreadIds.length > 99 ? "99+" : unreadIds.length}
                  </b>
                )}
              </button>
              {notificationsOpen && (
                <div
                  className="notification-panel"
                  role="menu"
                  aria-label="Notifications"
                >
                  <div className="dropdown-heading">
                    <div>
                      <strong>Notifications</strong>
                      <small>
                        {unreadIds.length
                          ? `${unreadIds.length} unread`
                          : "All caught up"}
                      </small>
                    </div>
                    {notificationItems.length > 0 && (
                      <button
                        type="button"
                        className="mark-read-button"
                        onClick={markAllNotificationsRead}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="notification-list">
                    {notificationItems.length === 0 ? (
                      <div className="notification-empty">
                        <span>✓</span>
                        <strong>No new notifications</strong>
                        <p>
                          There are no current birthdays, anniversary
                          milestones, or failed deliveries.
                        </p>
                      </div>
                    ) : (
                      notificationItems.map((item) => {
                        const unread = unreadIds.includes(item.id);
                        return (
                          <button
                            type="button"
                            role="menuitem"
                            className={`notification-item ${unread ? "unread" : ""}`}
                            key={item.id}
                            onClick={() => markNotificationRead(item.id)}
                          >
                            <span className={`notification-type ${item.type}`}>
                              {item.type === "error"
                                ? "!"
                                : item.type === "anniversary"
                                  ? "★"
                                  : "🎂"}
                            </span>
                            <span>
                              <strong>{item.title}</strong>
                              <small>{item.detail}</small>
                            </span>
                            {unread && <i aria-label="Unread" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="profile-control" ref={profileRef}>
              <button
                type="button"
                className="topbar-profile"
                aria-label="Open admin profile menu"
                aria-expanded={profileOpen}
                aria-haspopup="menu"
                onClick={() => {
                  setNotificationsOpen(false);
                  setProfileOpen((current) => !current);
                }}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setProfileOpen(true);
                  }
                }}
              >
                <span className="avatar small-avatar">
                  {initials(account.fullName || account.email)}
                </span>
                <span>
                  <strong>{account.fullName || "SmartHR User"}</strong>
                  <small>Admin</small>
                </span>
                <span className="profile-chevron" aria-hidden="true">
                  ⌄
                </span>
              </button>
              {profileOpen && (
                <div
                  className="profile-dropdown"
                  role="menu"
                  aria-label="Admin profile"
                >
                  <div className="profile-dropdown-header">
                    <span className="avatar">
                      {initials(account.fullName || account.email)}
                    </span>
                    <div>
                      <strong>{account.fullName || "SmartHR User"}</strong>
                      <small>{account.email || "HR Administrator"}</small>
                      <em>HR Administrator</em>
                    </div>
                  </div>
                  <div className="profile-menu-list">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => openSettingsSection("admin-profile")}
                    >
                      <span>◉</span>My Profile
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => openSettingsSection("account-settings")}
                    >
                      <span>⚙</span>Account Settings
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className="profile-logout"
                      onClick={onLogout}
                    >
                      <span>⏻</span>Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {pages[active]}
      </main>
    </div>
  );
}

function getSavedSession() {
  const savedSession =
    localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
  if (!savedSession) return null;
  try {
    return JSON.parse(savedSession);
  } catch {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function App() {
  const [account, setAccount] = useState(() => getSavedSession());

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    setAccount(null);
  };

  if (!account) return <AuthPage onLogin={setAccount} />;
  return <DashboardApp account={account} onLogout={handleLogout} />;
}

export default App;
