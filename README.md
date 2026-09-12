# PayLens

**PayLens** is a modern, high-performance web application designed to help organizations manage, analyze, and visualize employee compensation data globally. 

It provides an intuitive user interface to view employee records, analyze salary trends across different departments and countries, and even ask questions using a built-in intelligent assistant.

---

## 🏗️ Technology Stack

- **Frontend:** Angular 19 (Standalone Components, Signals, RxJS, Chart.js for graphs)
- **Backend:** Spring Boot (Java 21, Spring Web, Spring JDBC)
- **Database:** PostgreSQL (using advanced SQL features like `PERCENTILE_CONT`)

---

## ✨ Features Explained (Simple Words)

Here is a breakdown of every major feature in the application and how the frontend and backend work together to make it happen.

### 1. Dashboard
- **What it is:** The homepage of the application that gives you a quick, high-level summary of the company. It shows the total number of employees, total payroll, average salary, the most expensive department, and a list of recently hired employees.
- **How it works:** The Angular frontend requests the dashboard data. The Spring Boot backend runs an optimized SQL query that groups and sums up the data in the database, returning only the final numbers. This ensures it loads instantly.

### 2. Employee Directory
- **What it is:** A comprehensive, searchable table of all employees in the organization. You can filter employees by their Name, Country, Department, Job Title, and Employment Status.
- **Frontend:** Provides a clean table with dropdown filters and "Next/Previous" page buttons. When you change a filter, it waits for you to stop typing (debouncing) before asking the server for new data.
- **Backend:** Instead of sending all 10,000+ employees to your browser (which would crash it), the backend uses "Server-Side Pagination". It dynamically generates a SQL query based on your exact filters and only returns the 10 or 20 employees needed for that specific page.

### 3. Analytics Hub
- **What it is:** A deep-dive page full of charts and data tables. It features a Salary Distribution bar chart, overall compensation summaries, salary percentiles (Min, Median, Max), and aggregate tables broken down by Department and Country.
- **Frontend:** The charts and tables dynamically update *seamlessly* when you apply filters. Thanks to Angular Signals, the UI morphs and animates the new data without the screen flickering or showing annoying loading spinners.
- **Backend:** Executes high-performance aggregate SQL queries using advanced PostgreSQL math functions like `PERCENTILE_CONT`. Crucially, it automatically converts all foreign employee salaries into a standardized currency (USD) on-the-fly by joining an FX Rates table, ensuring the math is perfectly accurate.

### 4. Ask PayLens (Intelligent Assistant)
- **What it is:** A chat-like interface where you can ask questions about your payroll data in plain English. For example: *"What is the average engineering salary in India?"* or *"Are there any salary outliers in Sales?"*
- **Frontend:** A clean chat window that sends your typed text to the server.
- **Backend:** Features a custom-built Natural Language Processing (NLP) heuristic engine. It reads your sentence, identifies what you are looking for (the "Intent" like Average, Highest, or Outliers), and identifies the filters (the "Entities" like India or Engineering). It then builds a dynamic SQL query, asks the database, and formulates a conversational, human-readable answer to send back to you!

---

## 🚀 How it was developed step-by-step

1. **Foundation & Mocking:** 
   We started by building the Angular UI using fake, hardcoded "mock" data. This allowed us to perfect the design, routing, and user experience (UX) without worrying about databases.
2. **Database Design:** 
   We created a robust PostgreSQL database schema to support employees and real-time foreign exchange (FX) rates.
3. **High-Performance APIs:** 
   We built Spring Boot REST APIs using `JdbcClient`. Instead of loading thousands of rows into Java memory (which is slow and uses a lot of RAM), we wrote highly optimized SQL queries that force the database to do the heavy lifting.
4. **Integration:** 
   We removed all the fake data from the frontend and wired the Angular services to make real HTTP requests to our new Spring Boot APIs.
5. **Polish & Optimization:** 
   We added Angular Signals to ensure the UI updates smoothly and seamlessly when filtering data, fixed edge cases (like handling empty data states), and built the dynamic NLP engine for the Ask PayLens tab.
