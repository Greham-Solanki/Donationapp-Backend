# GiveAway Community — Backend

REST API and real-time WebSocket server for the GiveAway Community donation platform. Built with Node.js and Express, deployed on AWS EC2 Auto Scaling behind an Application Load Balancer.


**Frontend Repo:** [Donationapp--frontend](https://github.com/Greham-Solanki/Donationapp--frontend)

**Project Demo:** [Youtube](https://youtu.be/iWrAFw4k-R8)

**AWS Infrastructure Diagram:** [Diagram](https://github.com/Greham-Solanki/Donationapp-Backend/blob/main/AWS%20Infrastructure%20Diagram.png)

---

## Features

- JWT authentication (register, login)
- Donation CRUD — create, read, update, delete
- Image upload to AWS S3 with signed URLs
- Real-time chat via Socket.io
- Notifications system
- User profile management
- Health check endpoint for ALB

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 |
| Framework | Express |
| Database | MongoDB Atlas |
| Real-time | Socket.io |
| Auth | JWT |
| File uploads | Multer + AWS S3 |
| Process manager | PM2 |
| Hosting | AWS EC2 (Auto Scaling Group) |
| Load balancer | AWS ALB (HTTPS:443) |
| CI/CD | GitHub Actions |
| Secrets | AWS SSM Parameter Store |

---

## Architecture

```
Internet
  │
  ▼
Internet Gateway (IGW)
  │
  ▼
Public Subnet (AZ1 + AZ2)
  ├── Application Load Balancer (HTTPS:443)
  └── NAT Gateway (outbound traffic)
        │
        ▼
Private Subnet (AZ1 + AZ2)
  └── EC2 Auto Scaling Group
        │ (port 5000)
        ▼
    Node.js + Express + Socket.io
        │
        ▼
    MongoDB Atlas (external)
    AWS S3 (image storage)
```

New EC2 instances bootstrap automatically via Launch Template User Data:
- Installs Node.js, PM2, AWS CLI
- Clones this repo
- Pulls secrets from SSM Parameter Store
- Writes `.env` and starts the app with PM2

---

## CI/CD Pipeline

Every push to `main` triggers the GitHub Actions workflow:

```
git push → GitHub Actions
  │
  ├── Get live EC2 IPs from ASG
  ├── SSH via Bastion Host → each EC2
  │     ├── git pull origin main
  │     ├── write .env from GitHub secrets
  │     ├── npm install --omit=dev
  │     └── pm2 restart backend
  └── Done
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login and get JWT token |

### Donations
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/donations/donate` | Create donation (with image) |
| GET | `/api/donations` | Get all available donations |
| GET | `/api/donations/:id` | Get donation by ID |
| GET | `/api/donations/donor/:donorId` | Get donations by donor |
| DELETE | `/api/donations/:id` | Delete donation |

### Users
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users/:email` | Get user profile |
| PUT | `/api/users/:id` | Update user profile |

### Notifications
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/notifications/user/:userId` | Get user notifications |

### Health
| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | ALB health check |

---

## Environment Variables

```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret
S3_BUCKET_NAME=your-bucket
AWS_REGION=ca-central-1
```

In production these are stored in **AWS SSM Parameter Store** and fetched automatically on instance startup.

---

## Local Development

```bash
# Clone the repo
git clone https://github.com/Greham-Solanki/Donationapp-Backend.git
cd Donationapp-Backend

# Install dependencies
npm install

# Create .env
cat > .env << EOF
PORT=5000
NODE_ENV=development
MONGODB_URI=your-mongodb-uri
JWT_SECRET=your-secret
S3_BUCKET_NAME=your-bucket
AWS_REGION=ca-central-1
EOF

# Start dev server
npm start
```

API runs at `http://localhost:5000`

---

## GitHub Actions Secrets Required

| Secret | Description |
|---|---|
| `AWS_ACCESS_KEY_ID` | IAM user access key |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret key |
| `AWS_REGION` | `ca-central-1` |
| `ASG_NAME` | Auto Scaling Group name |
| `BASTION_IP` | Bastion host public IP |
| `EC2_SSH_KEY` | Private key for SSH access |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | JWT signing secret |
| `PORT` | App port (5000) |
| `NODE_ENV` | `production` |
| `S3_BUCKET_NAME` | S3 bucket for donation images |

---

## AWS Infrastructure

| Service | Purpose |
|---|---|
| EC2 Auto Scaling | Runs the Node.js backend, scales automatically |
| Application Load Balancer | HTTPS termination, distributes traffic across instances |
| NAT Gateway | Allows private EC2s to reach MongoDB Atlas and GitHub |
| Bastion Host | Secure SSH access to private EC2 instances |
| S3 | Stores donation item images |
| SSM Parameter Store | Secure secrets management |
| ACM | SSL certificate for `api.giveawaycommunity.dedyn.io` |
| IAM | Least-privilege roles for EC2 and GitHub Actions |
| WAF | Web Application Firewall on CloudFront |

---

## Project Structure

```
├── controllers/
│   ├── authController.js
│   ├── donationController.js
│   ├── userController.js
│   ├── chatController.js
│   └── notificationController.js
├── models/
│   ├── User.js
│   ├── Donation.js
│   ├── Chat.js
│   └── Notification.js
├── routes/
│   ├── authRoutes.js
│   ├── donationRoutes.js
│   ├── userRoutes.js
│   ├── chatRoutes.js
│   └── notificationRoutes.js
├── middleware/
│   └── auth.js
├── server.js
└── .env
```

---

## Related

- [Frontend Repository](https://github.com/Greham-Solanki/Donationapp--frontend)
