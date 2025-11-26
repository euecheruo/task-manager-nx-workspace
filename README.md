# Nx Task Management System

This project is a secure, scalable Task Management System built within an **Nx Monorepo**. It features an **Angular 18+** frontend using Signals and a **NestJS** backend using PostgreSQL, secured by **RBAC** (Role-Based Access Control) and **JWT** authentication.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Development Script](#development-scripts)
- [Database Management](#database-management)
- [Roles and Permissions](#roles-and-permissions)
- [Testing](#testing)

## Prerequisites
- **Node.js** (Latest LTS recommended)
- **PostgreSQL** (Running locally or via Docker)
- **Nx CLI** (Globally installed or via `npx`)

## Project Structure
The workspace is divided into applications and libraries:
- **apps/taskmanagerchallengeapp**: Angular Frontend.
- **apps/taskmanagerchallengeserver**: NestJS Backend.
- **libs/api**: Backend modules (Auth, Users, Tasks, Data Access).
- **libs/app**: Frontend features and utilities.

## Development Scripts

Use the following commands to build, serve, and test the applications.

### Start the Applications

**Run Angular Frontend**
```bash
npx nx serve taskmanagerchallengeapp
```
*Starts the Angular application in development mode (default: http://localhost:4200).*

**Run NestJS Backend**
```bash
npx nx serve taskmanagerchallengeserver
```
*Starts the NestJS API server in watch mode (default: http://localhost:3000). Note: Use this command to run the backend in development environment.*

### Database Management

The project includes a custom `SeederService` to manage the database state.

**Seed the Database**
```bash
npx nx migration taskmanagerchallengeserver --migrate=seed --configuration=development
```
*Creates the schema and populates the database with Roles, Permissions, and initial Users (e.g., `user1@faketest.com`).*

**Unseed the Database**
```bash
npx nx migration taskmanagerchallengeserver --migrate=unseed --configuration=development
```
*Drops all tables and clears all data from the database.*

### Roles and Permissions

The system implements a comprehensive RBAC model.

#### User Roles

| Role Name | Description | Capabilities |
| :--- | :--- | :--- |
| **Editor** | Full Access Creator | Can create tasks, view all tasks, delete/update *own* tasks, and manage assignments. |
| **Viewer** | Read-Only / Assignee | Can view all tasks, assign/unassign tasks, and change status of assigned tasks. Cannot create or delete. |

#### Permission Matrix

| Permission String | Description | Assigned To |
| :--- | :--- | :--- |
| `create:tasks` | Create new tasks | Editor |
| `read:tasks` | View tasks and details | Editor, Viewer |
| `assign:tasks` | Assign unassigned tasks | Editor, Viewer |
| `unassign:tasks` | Unassign assigned tasks | Editor, Viewer |
| `update:own:tasks` | Update Title/Description (Creator only) | Editor |
| `delete:own:tasks` | Delete Tasks (Creator only) | Editor |
| `mark:assigned:tasks` | Mark task as Complete | Editor, Viewer |
| `unmark:assigned:tasks` | Mark task as Incomplete | Editor, Viewer |
| `read:own:accounts` | View own profile | Editor, Viewer |

### Testing

**Run All Unit Tests**
```bash
npx nx run-many -t test
```
*Executes unit tests for both the Angular frontend and NestJS backend.*

**Run Backend E2E Tests**
```bash
npx nx e2e taskmanagerchallengeserver-e2e
```
*Executes end-to-end tests against the running API to verify endpoints and database integration.*

**Run Frontend E2E Tests**
```bash
npx nx e2e taskmanagerchallengeapp-e2e
```
*Executes Playwright end-to-end tests against the Angular application, simulating user interactions.*
