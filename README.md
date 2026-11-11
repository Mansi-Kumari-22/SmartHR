# SmartHR – HR Management System

SmartHR is a full-stack Human Resource Management System built to simplify employee management and automate HR operations. It provides a centralized platform to manage employee information and automate birthday and work anniversary notifications.

## Features

- Employee Management – Add, edit, delete and manage employee records.
- Search & Filtering – Search employees and filter records by department.
- Dashboard – View important employee information and notifications.
- Birthday Notifications – Automated birthday email notifications.
- Work Anniversary Notifications – Automated milestone-based anniversary emails.
- Email Delivery Logs – Track successful and failed email deliveries.
- Duplicate Prevention – Prevent duplicate employee records and repeated birthday notifications.

## Technology Stack

- Frontend: React.js, JavaScript, HTML, CSS
- Backend: Node.js, Express.js
- Database: MongoDB, MongoDB Atlas
- API: REST APIs
- Email Service: Nodemailer, SMTP
- Scheduler: Node-Cron
- Deployment: Railway
- Version Control: Git & GitHub

## Project Structure

- frontend – React-based user interface.
- backend – Express server, API routes, database models and email services.

## Installation & Setup

1. Clone the repository.
2. Install backend dependencies using `npm install` inside the backend folder.
3. Configure the required environment variables in the backend `.env` file.
4. Start the backend server using `npm run dev`.
5. Install frontend dependencies inside the frontend folder.
6. Start the frontend development server using `npm run dev`.

## Environment Variables

Configure the required variables in the backend `.env` file, including:

- MONGO_URI
- SMTP_HOST
- SMTP_PORT
- SMTP_USER
- SMTP_PASS
- SMTP_FROM

Never upload your `.env` file or credentials to GitHub.

## Purpose

The main objective of SmartHR is to reduce manual HR tasks, improve employee data management and automate important employee notifications.

## Developer

Developed as a full-stack web development project.