# Admin Dashboard

A comprehensive admin panel API with role-based access control (RBAC) built with Node.js and modern web technologies.

## Description

The Admin Dashboard is a robust backend API system designed to provide secure, scalable administrative functionality for web applications. It features a sophisticated role-based access control system that allows administrators to manage users, permissions, and system resources with granular control.

## Features

- **Role-Based Access Control (RBAC)**: Comprehensive permission management system
- **User Management**: Secure user authentication and authorization
- **API Security**: JWT-based authentication with refresh token support
- **Database Integration**: Flexible database support with ORM
- **API Documentation**: Comprehensive API documentation with examples
- **Testing Suite**: Full test coverage for all endpoints
- **Logging & Monitoring**: Advanced logging and system monitoring
- **Rate Limiting**: Built-in rate limiting and security measures
- **CORS Support**: Configurable cross-origin resource sharing
- **Environment Configuration**: Multi-environment configuration support

## Installation & Usage

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager
- Database (MongoDB Atlas)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/admin-dashboard.git
   cd admin-dashboard
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Initialize the database:

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. Start the development server:
   ```bash
   node server.js
   ```

### Usage

The API will be available at `http://localhost:3000` (or your configured port).

#### Authentication

```bash
# Login to get access token
POST /api/auth/login
{
  "email": "admin@example.com",
  "password": "password123"
}
```

#### API Endpoints

- `POST /api/auth/login` - User authentication
- `GET /api/users` - List users (admin only)
- `POST /api/users` - Create new user (admin only)
- `PUT /api/users/:id` - Update user (admin or self)
- `DELETE /api/users/:id` - Delete user (admin only)

## Technologies Used

- **Backend**: Node.js, Express.js
- **Database**: MongoDB Atlas
- **Authentication**: JWT, bcrypt
- **Validation**: Joi, express-validator
- **Testing**: Jest, Supertest
- **Documentation**: Swagger/OpenAPI
- **Security**: Helmet, CORS, rate-limiting
- **Development**: Nodemon, ESLint, Prettier

## Project Structure

```
admin-dashboard/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Custom middleware
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Utility functions
│   │   └── app.js          # Express app configuration
│   ├── tests/               # Test files
│   ├── package.json         # Backend dependencies
│   └── README.md           # Backend documentation
├── .gitignore              # Git ignore rules
└── README.md               # Project overview
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**Azeez Damilare Gbenga** - [GitHub Profile](https://github.com/dazeez1)

---
