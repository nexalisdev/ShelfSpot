# Project Purpose
ShelfSpot is a project designed to manage and organize various resources, including alerts, consumables, containers, items, notifications, places, preferences, projects, rooms, scoring, and tags. It provides both backend and frontend components to handle these functionalities efficiently.

# Tech Stack
- **Backend**: Built with TypeScript using the NestJS framework. It includes Prisma for database management and Swagger for API documentation.
- **Frontend**: Developed with Next.js, utilizing TypeScript and TailwindCSS for styling.
- **Database**: Managed using Prisma ORM.
- **Containerization**: Docker is used for containerization, with multiple Dockerfiles and docker-compose configurations.

# Code Style and Conventions
- **Backend**: TypeScript with NestJS conventions. DTOs (Data Transfer Objects) are used for data validation and transfer.
- **Frontend**: TypeScript with Next.js conventions. TailwindCSS is used for styling.
- **Linting**: ESLint is configured for both backend and frontend.
- **Formatting**: Prettier is used for consistent code formatting.

# Rough Structure of the Codebase
- **Backend**:
  - `src/`: Contains the main application code, organized into modules such as `alerts`, `auth`, `consumables`, etc.
  - `prisma/`: Contains Prisma schema and migrations.
  - `routes/`: Contains route definitions.
  - `Dockerfile`, `docker-entrypoint.sh`: Docker-related files.
- **Frontend**:
  - `src/`: Contains the main application code, including `app/`, `components/`, `lib/`, etc.
  - `prisma/`: Contains Prisma schema and migrations.
  - `public/`: Contains static assets.
  - `Dockerfile`: Docker-related file.
- **Install**:
  - `classic_install/` and `complete_install/`: Scripts and configurations for installation.
  - `documentation/`: Contains project documentation.

# Guidelines and Design Patterns
- **Backend**: Follows NestJS module-based architecture. DTOs are used for data validation.
- **Frontend**: Follows Next.js conventions with a focus on modular components.
- **Database**: Prisma is used for schema management and migrations.
- **Styling**: TailwindCSS is used for consistent and responsive design.