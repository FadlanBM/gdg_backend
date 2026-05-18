<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>

## Description
**GDG Backend** is a high-performance, type-safe backend application built with NestJS, PostgreSQL, and Drizzle ORM. It features a modular architecture, JWT authentication, and automated API documentation.

## Tech Stack
- **Core**: [NestJS](https://nestjs.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **API Documentation**: [Swagger](https://swagger.io/)
- **Authentication**: [Passport JWT](https://www.passportjs.org/packages/passport-jwt/)
- **Password Hashing**: [bcrypt](https://www.npmjs.com/package/bcrypt)

## Project Structure
The project follows a modular and clean architecture:
```text
src/
├── app/                # Main Application components
├── auth/               # Authentication & Authorization (JWT)
├── common/             # Global components (Guards, Interceptors, DTOs)
├── config/             # Environment configurations
├── database/           # Drizzle schema & database provider
├── users/              # User management & Profiles
├── app.module.ts       # Central module registration
└── main.ts            # Entry point & Swagger setup
```

## Getting Started

### 1. Project Setup
```bash
$ npm install
```

### 2. Environment Variables
Create a `.env` file in the root directory:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/db_name
JWT_SECRET=your_super_secret_key
```

### 3. Database Migrations
```bash
# Generate migrations
$ npx drizzle-kit generate

# Apply migrations (Directly to DB)
$ npx drizzle-kit push
```

### 4. Running the App
```bash
# development
$ npm run start:dev

# production mode
$ npm run start:prod
```

## API Documentation
Once the app is running, access the interactive Swagger documentation at:
`http://localhost:3000/api-docs`

## Features implemented
- [x] PostgreSQL connection with Drizzle ORM
- [x] Global Database Module with Pool Connection
- [x] User & Profile Schema with UUID
- [x] JWT Authentication Flow (Login & Register)
- [x] Password encryption with Bcrypt
- [x] Swagger API Documentation
- [x] Centralized Configuration Management
- [x] Clean Folder Architecture

## License
Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
