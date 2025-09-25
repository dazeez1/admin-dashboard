# Admin Dashboard RBAC API

A secure Node.js backend API with JWT authentication, refresh token system, and Role-Based Access Control (RBAC), built with Express.js and MongoDB.

## Description

This backend service provides a robust authentication system with role-based access control (RBAC). It features JWT access tokens, refresh token rotation, password hashing with bcrypt, and comprehensive security middleware.

## Features

- **JWT Authentication**: Access tokens (15min) + Refresh tokens (7days)
- **Role-Based Access Control (RBAC)**: Admin, Manager, User roles with granular permissions
- **Password Security**: Bcrypt hashing with configurable rounds
- **Refresh Token Rotation**: Secure token renewal system
- **Activity Logging**: Comprehensive audit trail for all user actions
- **Statistics Dashboard**: Real-time stats with MongoDB aggregation
- **User Management**: Complete CRUD operations with role-based access
- **Account Security**: Login attempt tracking and account locking
- **MongoDB Integration**: Mongoose ODM for data persistence
- **Input Validation**: Express-validator for request validation
- **Rate Limiting**: Protection against brute force attacks
- **Security Headers**: Helmet.js for security headers
- **CORS Support**: Configurable cross-origin resource sharing
- **Comprehensive Testing**: Jest test suite for all endpoints

## **Quick Start**

### **1. Test the Live API**

```bash
# Health Check
curl https://admin-dashboard-ea64.onrender.com/health

# Register User
curl -X POST https://admin-dashboard-ea64.onrender.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"TestPass123!"}'
```

## **Local Development Setup**

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   ```bash
   cp env.production.example .env
   # Edit .env with your configuration
   ```

4. Start MongoDB (make sure MongoDB is running locally or update MONGO_URI)

5. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/admin-dashboard-rbac

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=http://localhost:3000
```

## **API Endpoints**

### **Authentication Endpoints**

#### POST /api/auth/signup

Register a new user with default role 'user'.

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

#### POST /api/auth/login

Authenticate user and receive tokens.

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "lastLogin": "2024-01-01T00:00:00.000Z"
    },
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

#### POST /api/auth/refresh

Refresh access token using refresh token.

**Request Body:**

```json
{
  "refreshToken": "jwt_refresh_token"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Tokens refreshed successfully",
  "data": {
    "accessToken": "new_jwt_access_token",
    "refreshToken": "new_jwt_refresh_token"
  }
}
```

#### POST /api/auth/logout

Invalidate refresh token.

**Request Body:**

```json
{
  "refreshToken": "jwt_refresh_token"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Logout successful"
}
```

#### GET /api/auth/profile

Get current user profile (requires Bearer token).

**Headers:**

```
Authorization: Bearer jwt_access_token
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### **Admin Endpoints (Protected)**

#### GET /api/admin/users

Get all users (Admin only)

**Headers:**

```
Authorization: Bearer jwt_access_token
```

**Response:**

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user_id",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "user",
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "total": 1
  }
}
```

#### PATCH /api/admin/users/:id/role

Update user role (Admin only)

**Headers:**

```
Authorization: Bearer jwt_access_token
Content-Type: application/json
```

**Request Body:**

```json
{
  "role": "admin"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User role updated successfully",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "admin",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### **Statistics Endpoints (Admin/Manager)**

#### GET /api/admin/stats/users

Get user statistics by role

**Headers:**

```
Authorization: Bearer jwt_access_token
```

**Response:**

```json
{
  "success": true,
  "data": {
    "totalUsers": 10,
    "usersByRole": {
      "admin": 2,
      "manager": 3,
      "user": 5
    },
    "activeUsers": 8,
    "inactiveUsers": 2
  }
}
```

#### GET /api/admin/stats/logins

Get login statistics

**Headers:**

```
Authorization: Bearer jwt_access_token
```

**Query Parameters:**

- `days` (optional): Number of days to analyze (default: 7)

**Response:**

```json
{
  "success": true,
  "data": {
    "period": "7 days",
    "totalLogins": 45,
    "successfulLogins": 42,
    "failedLogins": 3,
    "successRate": 93.33,
    "dailyBreakdown": [
      {
        "date": "2024-01-01",
        "successful": 6,
        "failed": 0
      }
    ]
  }
}
```

### **Activity Logs Endpoints (Admin/Manager)**

#### GET /api/admin/logs

Get activity logs

**Headers:**

```
Authorization: Bearer jwt_access_token
```

**Query Parameters:**

- `action` (optional): Filter by action type
- `userId` (optional): Filter by user ID
- `limit` (optional): Number of logs to return (default: 50)

**Response:**

```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "log_id",
        "userId": "user_id",
        "userName": "John Doe",
        "action": "login",
        "resource": "auth",
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0...",
        "timestamp": "2024-01-01T00:00:00.000Z"
      }
    ],
    "total": 1,
    "pagination": {
      "page": 1,
      "limit": 50,
      "totalPages": 1
    }
  }
}
```

#### GET /api/admin/logs/export

Export activity logs (Admin only)

**Headers:**

```
Authorization: Bearer jwt_access_token
```

**Query Parameters:**

- `format`: Export format (`json` or `csv`)
- `limit` (optional): Number of logs to export (default: 1000)

**Response:** File download or JSON array

### **Health Check**

#### GET /health

Check server status.

**Response:**

```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development"
}
```

## **Testing & API Documentation**

### **Postman Collection**

We provide a comprehensive Postman collection for testing all endpoints:

- **`Admin-Dashboard-Live-Demo.postman_collection.json`** - Live demo collection with pre-configured URLs
- **`Admin-Dashboard-RBAC-Simple.postman_collection.json`** - Simple collection for manual testing

**Features:**

- 25+ test cases covering all endpoints
- Pre-configured with live production URLs
- Organized into logical phases (Setup, Authentication, RBAC Testing, etc.)
- Detailed descriptions and step-by-step instructions
- Token management examples

### **Manual Testing**

Test the live API with curl commands:

```bash
# 1. Health Check
curl https://admin-dashboard-ea64.onrender.com/health

# 2. Register User
curl -X POST https://admin-dashboard-ea64.onrender.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"TestPass123!"}'

# 3. Login (use token from signup response)
curl -X POST https://admin-dashboard-ea64.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!"}'

# 4. Get Profile (use accessToken from login response)
curl -X GET https://admin-dashboard-ea64.onrender.com/api/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### **RBAC Testing**

Test role-based access control:

```bash
# Regular user trying to access admin endpoint (should fail)
curl -X GET https://admin-dashboard-ea64.onrender.com/api/admin/users \
  -H "Authorization: Bearer USER_TOKEN"
# Expected: 403 Forbidden

# Admin accessing admin endpoint (should work)
curl -X GET https://admin-dashboard-ea64.onrender.com/api/admin/users \
  -H "Authorization: Bearer ADMIN_TOKEN"
# Expected: 200 OK with user list
```

## **Development**

### Available Scripts

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm test` - Run test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage

## Testing

Run the comprehensive test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## **Technologies Used**

### **Backend Technologies**

- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **bcrypt** - Password hashing
- **Helmet.js** - Security headers middleware
- **express-rate-limit** - Rate limiting middleware
- **express-validator** - Input validation
- **cors** - Cross-origin resource sharing
- **dotenv** - Environment variable management

### **Development Tools**

- **Nodemon** - Development server with auto-restart
- **Jest** - Testing framework
- **Supertest** - HTTP assertion library
- **ESLint** - Code linting
- **Postman** - API testing and documentation

### **Deployment & Infrastructure**

- **Render** - Cloud hosting platform
- **MongoDB Atlas** - Cloud database service
- **GitHub** - Version control and CI/CD
- **YAML** - Infrastructure as Code configuration

## 🔒 **Security Features**

- **JWT Access Tokens**: Short-lived (15 minutes) for API access
- **Refresh Tokens**: Long-lived (7 days) stored in database
- **Password Hashing**: Bcrypt with configurable salt rounds
- **Token Rotation**: New refresh token issued on each refresh
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: Comprehensive request validation
- **CORS Protection**: Configurable cross-origin policies
- **Security Headers**: Helmet.js for security headers
- **Token Invalidation**: Refresh tokens removed on logout

## Role-Based Access Control (RBAC)

### Roles and Permissions

**Admin Role:**

- Full access to all resources
- Can manage users (create, read, update, delete)
- Can view all statistics
- Can view, delete, and export all activity logs
- Can change user roles and reset passwords

**Manager Role:**

- Limited administrative access
- Can view and update users (but not delete)
- Can view statistics
- Can view and export activity logs (but not delete)
- Cannot change user roles or reset passwords

**User Role:**

- Basic access only
- Can view and update their own profile
- Cannot access user management, statistics, or activity logs
- Cannot perform administrative actions

### Permission Matrix

| Resource | Action | Admin | Manager | User     |
| -------- | ------ | ----- | ------- | -------- |
| Users    | Create | ✅    | ❌      | ❌       |
| Users    | Read   | ✅    | ✅      | Own only |
| Users    | Update | ✅    | ✅      | Own only |
| Users    | Delete | ✅    | ❌      | ❌       |
| Stats    | Read   | ✅    | ✅      | ❌       |
| Logs     | Read   | ✅    | ✅      | ❌       |
| Logs     | Delete | ✅    | ❌      | ❌       |
| Logs     | Export | ✅    | ✅      | ❌       |
| Profile  | Read   | ✅    | ✅      | Own only |
| Profile  | Update | ✅    | ✅      | Own only |

## Database Schema

### User Model

```javascript
{
  name: String (required, 2-50 chars),
  email: String (required, unique, valid email),
  password: String (required, min 6 chars, hashed),
  role: String (enum: ['user', 'admin', 'moderator'], default: 'user'),
  refreshTokens: [{
    token: String,
    createdAt: Date (expires in 7 days)
  }],
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Validation error message",
      "value": "invalidValue"
    }
  ]
}
```

## **Deployment**

### **Deployment Configuration**

The project includes comprehensive deployment configuration:

- **`render.yaml`** - Infrastructure as Code for Render
- **`env.production.example`** - Production environment template
- **`RENDER-DEPLOYMENT-GUIDE.md`** - Step-by-step deployment guide
- **`PRODUCTION-README.md`** - Production-specific documentation

### **Environment Variables (Production)**

```env
NODE_ENV=production
PORT=10000
MONGO_URI=your-mongodb-atlas-connection-string
JWT_SECRET=your-jwt-secret-key
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=https://admin-dashboard-ea64.onrender.com
```

## **Performance & Monitoring**

### **Key Metrics**

- **Response Time**: < 500ms average
- **Uptime**: 99.9% target
- **Error Rate**: < 0.1%
- **Rate Limiting**: 100 requests per 15 minutes per IP

### **Monitoring Tools**

- Render Dashboard for logs and metrics
- MongoDB Atlas for database performance
- Health endpoint for API status

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 **Author**

**Azeez Damilare Gbenga**

- GitHub: [dazeez1](https://github.com/dazeez1)
