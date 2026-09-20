# InternFlow — From Application to Offer

InternFlow is a full-stack internship application management platform built to make the internship search a little less chaotic.

When students apply to multiple companies, it is very easy to lose track of deadlines, assessments, interviews, follow-ups, and the documents needed for each application.

InternFlow brings all of that into one place.

The idea is simple:

**Discover → Apply → Prepare → Assess → Interview → Follow-up → Offer**

Instead of keeping everything in spreadsheets, notes, browser tabs, and reminders, InternFlow gives students one dashboard to manage the complete journey.

---

## Why I built this

The internship application process is usually scattered across different platforms.

One company may have an application deadline.
Another may send an assessment.
Another may schedule an interview.
Then there are follow-up emails and documents to keep track of.

I wanted to build something that treats the application process more like a workflow rather than just a list of applications.

That is how InternFlow started.

---

## What InternFlow does

### Application Tracking

Students can create and manage internship applications with information such as:

- Company
- Role
- Location
- Application date
- Deadline
- Assessment date
- Interview date
- Follow-up date
- Skills
- Documents
- Job description
- Notes
- Application source

Applications are stored in the AWS backend rather than only in browser storage.

---

### AI Job Description Analysis

InternFlow can analyze a job description using AI and extract useful information such as:

- Company
- Job role
- Location
- Required skills
- Required documents
- Application deadline

This helps reduce the amount of manual data entry required when adding an application.

---

### Smart Notifications

InternFlow keeps track of important application events.

The notification system can surface:

- Deadlines
- Assessments
- Interviews
- Follow-ups

Notifications include the relevant date so that the user knows exactly what action is coming up.

There are also browser notifications for important application events.

---

### Email Reminders

InternFlow also includes real AWS-powered email reminders.

The flow is:

```text
Application data
       ↓
AWS data layer
       ↓
Scheduled Lambda function
       ↓
Amazon SES
       ↓
User's email