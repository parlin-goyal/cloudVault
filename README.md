# CloudVault — Cloud-Based File Storage System

CloudVault is a full-stack web application that allows registered users to securely upload, download and delete files. The frontend is built with **React**, the backend with **Node.js and Express**, files are stored in **Amazon S3**, the application is hosted on **Amazon EC2**, and access between EC2 and S3 is controlled by **AWS IAM**.

---

## 1. Problem Statement

Individuals and small teams need a simple, secure place to store files that is accessible from any device. Local storage is limited and can be lost, while public file-sharing links expose data. CloudVault provides private, per-user cloud storage with authentication, built on scalable and durable AWS infrastructure.

## 2. Objectives

1. Allow users to register and log in securely.
2. Allow users to upload, list, search, download and delete their own files.
3. Store files durably in Amazon S3 instead of on the application server.
4. Host the application on Amazon EC2.
5. Use AWS IAM roles so that no AWS credentials are stored in the code.
6. Ensure each user can access only their own files.

## 3. Features

| Feature | Description |
|---|---|
| User authentication | Registration, login, logout; passwords hashed with bcrypt; JWT stored in an HttpOnly cookie |
| File upload | Drag-and-drop, multiple files, live progress bar, size limit (25 MB by default) |
| File download | Through short-lived pre-signed S3 URLs (valid for 5 minutes) |
| File deletion | Confirmation dialog; removes the file from S3 and the database |
| Dashboard | File list, file-type badges, search, total files and storage used |
| Responsive UI | Works on desktop and mobile |
| Data isolation | Every database query is restricted to the logged-in user |

## 4. System Architecture

```
┌──────────────┐        ┌──────────────────────────── AWS Cloud ────────────────────────────┐
│              │        │                                                                    │
│   Browser    │  HTTP  │   EC2 instance (Ubuntu)                                            │
│ (React app)  │───────►│   ┌──────────────────────────────────────────────────────────┐     │
│              │        │   │ Nginx (port 80)                                          │     │
└──────┬───────┘        │   │   ├── /        → serves built React files                │     │
       ▲                │   │   └── /api/*   → Express API (port 5000, run by PM2)      │     │
       │                │   │                     ├── JWT authentication                 │     │
       │                │   │                     ├── SQLite (users, file metadata)      │     │
       │                │   │                     └── AWS SDK v3                          │     │
       │                │   └──────────────────────────────┬───────────────────────────┘     │
       │                │                IAM Role           │ PutObject / DeleteObject        │
       │                │           (temporary credentials) │ pre-signed GetObject URL        │
       │                │                                   ▼                                 │
       └────────────────┼───── direct download ────  Amazon S3 bucket (private, encrypted)    │
                        │       via pre-signed URL    users/<userId>/<uuid>-<filename>        │
                        └────────────────────────────────────────────────────────────────────┘
```

### Request flows

- **Upload:** React sends the file to `POST /api/files` → Express verifies the JWT → Multer holds the file in memory → the AWS SDK uploads it to S3 (with AES-256 encryption) using the EC2 IAM role → metadata is saved in SQLite.
- **Download:** React calls `GET /api/files/:id/download` → Express confirms ownership → generates a pre-signed URL valid for 5 minutes → the browser downloads the file directly from S3.
- **Delete:** React calls `DELETE /api/files/:id` → Express confirms ownership → deletes the object from S3 → removes the record from SQLite.

## 5. AWS Services Used

| Service | Role in the project |
|---|---|
| **Amazon S3** | Stores all uploaded files in a private bucket with Block Public Access and server-side encryption (SSE-S3, AES-256) |
| **Amazon EC2** | Hosts Nginx, the React build and the Express API on an Ubuntu free-tier instance |
| **AWS IAM** | An IAM role attached to EC2 grants least-privilege access to one bucket; no access keys exist in the code or on the server |

## 6. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, React Router, Axios, Tailwind CSS v4, react-dropzone, react-hot-toast |
| Backend | Node.js 22, Express 5 |
| Authentication | jsonwebtoken (JWT), bcryptjs, cookie-parser |
| Database | SQLite (better-sqlite3) |
| File handling | Multer (memory storage) |
| Cloud SDK | AWS SDK for JavaScript v3 (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`) |
| Security | helmet, express-rate-limit, express-validator, cors |
| Logging | morgan |
| Deployment | Nginx (reverse proxy and static hosting), PM2 (process manager) |

## 7. Project Structure

```
cloudvault/
├── client/                         # React frontend
│   ├── public/favicon.svg
│   ├── src/
│   │   ├── api/
│   │   │   ├── axios.js            # Axios instance, 401 handling
│   │   │   ├── authApi.js          # register, login, logout, current user
│   │   │   └── filesApi.js         # list, upload (with progress), download, delete
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # Logged-in user state for the whole app
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProtectedRoute.jsx  # Only logged-in users
│   │   │   ├── PublicRoute.jsx     # Only logged-out users
│   │   │   ├── AuthLayout.jsx, FormField.jsx, Logo.jsx, Spinner.jsx
│   │   │   ├── FileUpload.jsx      # Drag-and-drop upload with progress
│   │   │   ├── FileList.jsx        # File table with search
│   │   │   ├── FileItem.jsx        # One file row
│   │   │   ├── StatCard.jsx
│   │   │   └── ConfirmDialog.jsx   # Delete confirmation
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── NotFound.jsx
│   │   ├── utils/
│   │   │   ├── format.js           # File size, date, file-type badge
│   │   │   └── errors.js           # Readable error messages
│   │   ├── App.jsx                 # Routes
│   │   ├── main.jsx                # Entry point
│   │   └── index.css               # Tailwind
│   ├── index.html
│   ├── vite.config.js              # Tailwind plugin + /api proxy for development
│   └── package.json
│
├── server/                         # Express backend
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.js              # Loads and validates environment variables
│   │   │   ├── db.js               # SQLite connection and tables
│   │   │   └── s3.js               # S3 client
│   │   ├── models/
│   │   │   ├── userModel.js
│   │   │   └── fileModel.js
│   │   ├── services/
│   │   │   └── s3Service.js        # Upload, pre-signed download URL, delete
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   └── fileController.js
│   │   ├── middleware/
│   │   │   ├── auth.js             # JWT cookie issue and verification
│   │   │   ├── upload.js           # Multer configuration
│   │   │   ├── validate.js         # Input validation rules
│   │   │   ├── rateLimiter.js      # Brute-force protection
│   │   │   ├── security.js         # CSRF protection
│   │   │   └── errorHandler.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   └── fileRoutes.js
│   │   ├── utils/AppError.js
│   │   ├── app.js                  # Express app and middleware
│   │   └── server.js               # Starts the server
│   ├── .env.example
│   └── package.json
│
├── deploy/
│   ├── iam-s3-policy.json          # Least-privilege IAM policy
│   ├── nginx.conf                  # Nginx configuration
│   ├── ecosystem.config.cjs        # PM2 configuration
│   ├── setup-ec2.sh                # One-command EC2 setup
│   └── update.sh                   # Redeploy after code changes
├── .gitignore
└── README.md
```

## 8. API Reference

All endpoints are under `/api`. State-changing requests must include the header `X-Requested-With: XMLHttpRequest` (the React app adds it automatically).

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | No | Health check |
| POST | `/api/auth/register` | No | Create an account `{ username, password }` |
| POST | `/api/auth/login` | No | Log in `{ username, password }` |
| POST | `/api/auth/logout` | No | Log out (clears the cookie) |
| GET | `/api/auth/me` | Yes | Current user |
| GET | `/api/files?search=` | Yes | List files and storage stats |
| POST | `/api/files` | Yes | Upload one file (multipart field `file`) |
| GET | `/api/files/:id/download` | Yes | Returns `{ url }`, a pre-signed S3 link |
| DELETE | `/api/files/:id` | Yes | Delete a file |

## 9. Database Schema (SQLite)

**users**

| Column | Type | Notes |
|---|---|---|
| id | INTEGER | Primary key |
| username | TEXT | Unique, case-insensitive |
| password_hash | TEXT | bcrypt hash (12 rounds) |
| created_at | TEXT | UTC timestamp |

**files**

| Column | Type | Notes |
|---|---|---|
| id | INTEGER | Primary key |
| user_id | INTEGER | Foreign key → users.id |
| original_name | TEXT | Name shown to the user |
| s3_key | TEXT | Unique object key in S3 |
| size_bytes | INTEGER | File size |
| mime_type | TEXT | File type |
| uploaded_at | TEXT | UTC timestamp |

---

## 10. Deployment on AWS (Step by Step)

Use a single AWS region for every resource, for example **Asia Pacific (Mumbai) – `ap-south-1`**. All resources below are covered by the AWS Free Tier.

### Step 1 — Create the S3 bucket

1. Open **S3 → Create bucket**.
2. **Bucket name:** a globally unique name, for example `cloudvault-files-<yourname>-2026`.
3. **AWS Region:** your chosen region.
4. **Object Ownership:** ACLs disabled (default).
5. **Block Public Access:** keep **Block all public access** checked.
6. **Default encryption:** SSE-S3 (default).
7. Click **Create bucket**.

### Step 2 — Create the IAM policy

1. Open **IAM → Policies → Create policy → JSON**.
2. Paste the contents of `deploy/iam-s3-policy.json` and replace **both** occurrences of `YOUR_BUCKET_NAME` with your bucket name.
3. Click **Next**, name the policy `CloudVaultS3Access`, and click **Create policy**.

### Step 3 — Create the IAM role for EC2

1. Open **IAM → Roles → Create role**.
2. **Trusted entity type:** AWS service. **Use case:** EC2. Click **Next**.
3. Select `CloudVaultS3Access`. Click **Next**.
4. Name the role `CloudVaultEC2Role` and click **Create role**.

### Step 4 — Launch the EC2 instance

1. Open **EC2 → Launch instance**.
2. **Name:** `cloudvault-server`.
3. **AMI:** Ubuntu Server 24.04 LTS.
4. **Instance type:** `t2.micro` or `t3.micro` (Free Tier eligible).
5. **Key pair:** create a new key pair and download the `.pem` file.
6. **Network settings → Edit**, create a security group with:
   - SSH, port 22, source **My IP**
   - HTTP, port 80, source **Anywhere (0.0.0.0/0)**
7. **Storage:** 8 GB is enough (up to 30 GB is free).
8. **Advanced details → IAM instance profile:** select `CloudVaultEC2Role`.
9. Click **Launch instance** and note the **Public IPv4 address**.

### Step 5 — Copy the project to the instance

**Option A: from your computer with the zip file** (Windows PowerShell, macOS or Linux terminal), in the folder containing `cloudvault.zip` and your `.pem` file:

```bash
scp -i your-key.pem cloudvault.zip ubuntu@<EC2_PUBLIC_IP>:~
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>
```

> On Windows, if SSH reports that the key's permissions are too open, right-click the `.pem` file → Properties → Security → Advanced → Disable inheritance → remove all users except your own account.

Then, on the instance:

```bash
sudo apt-get update -y && sudo apt-get install -y unzip
unzip cloudvault.zip -d ~
cd ~/cloudvault
```

**Option B: from GitHub.** Push the project to a repository, then on the instance run `git clone <repository-url> cloudvault && cd cloudvault`.

> You can also connect without a key file using **EC2 → Instances → select instance → Connect → EC2 Instance Connect**, and then use Option B.

### Step 6 — Configure the backend

```bash
cp server/.env.example server/.env
openssl rand -hex 48        # copy this output: it is your JWT_SECRET
nano server/.env
```

Set at least these values:

```
AWS_REGION=ap-south-1
S3_BUCKET=<your bucket name>
JWT_SECRET=<the random string generated above>
```

Do **not** add AWS access keys; the IAM role provides credentials automatically. Save with `Ctrl+O`, `Enter`, and exit with `Ctrl+X`.

### Step 7 — Install and start everything

```bash
bash deploy/setup-ec2.sh
```

The script adds swap memory, installs Node.js 22, Nginx and PM2, installs backend dependencies, builds the React app, configures Nginx, and starts the API with PM2 so it restarts automatically after a crash or reboot. It takes about 5–8 minutes.

### Step 8 — Verify

Open `http://<EC2_PUBLIC_IP>` in a browser, register an account, and upload a file. Then open the bucket in the S3 console: the file appears under `users/<id>/`.

Check the logs:

```bash
pm2 logs cloudvault-api --lines 20
```

The log should contain `Connected to S3 bucket "<your bucket>"`.

---

## 11. Running Locally (Optional)

Requirements: Node.js 20.19 or later, and an IAM **user** with the `CloudVaultS3Access` policy and an access key.

```bash
# Terminal 1 – backend
cd server
npm install
cp .env.example .env          # set AWS_REGION, S3_BUCKET, JWT_SECRET, NODE_ENV=development
                              # and uncomment AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY
npm run dev                   # http://localhost:5000

# Terminal 2 – frontend
cd client
npm install
npm run dev                   # http://localhost:5173
```

Open `http://localhost:5173`. The Vite development server forwards `/api` requests to the backend.

## 12. Useful Commands on EC2

| Task | Command |
|---|---|
| View live API logs | `pm2 logs cloudvault-api` |
| API status | `pm2 status` |
| Restart the API (after editing `server/.env`) | `pm2 restart cloudvault-api` |
| Redeploy after code changes | `bash deploy/update.sh` |
| Check Nginx | `sudo nginx -t && sudo systemctl status nginx` |
| Nginx error log | `sudo tail -n 50 /var/log/nginx/error.log` |
| Health check | `curl http://localhost/api/health` |

## 13. Security Measures

| Measure | Implementation |
|---|---|
| Password storage | bcrypt with 12 salt rounds; plain-text passwords are never stored |
| Session tokens | JWT in an HttpOnly, SameSite=Strict cookie, inaccessible to JavaScript |
| No hardcoded credentials | EC2 IAM role supplies temporary, automatically rotated AWS credentials |
| Least privilege | IAM policy allows only `ListBucket`, `PutObject`, `GetObject` and `DeleteObject` on one bucket |
| Private storage | S3 Block Public Access enabled; files reachable only through pre-signed URLs |
| Expiring downloads | Pre-signed URLs expire after 5 minutes |
| Encryption at rest | Every object uploaded with SSE-S3 (AES-256) |
| Access control | Every file query includes the logged-in user's ID |
| CSRF protection | SameSite=Strict cookie and a required `X-Requested-With` header |
| Brute-force protection | 10 failed logins per IP per 15 minutes; limits on registrations and API calls |
| Username enumeration | Identical error message and response time for unknown usernames and wrong passwords |
| Input validation | express-validator on all inputs |
| HTTP security headers | helmet |
| Upload limits | Enforced in the browser, in Express (Multer) and in Nginx |
| Network security | Security group exposes only port 80; SSH limited to your IP |

## 14. Troubleshooting

| Problem | Solution |
|---|---|
| Log shows `WARNING: cannot access S3 bucket` | Check `S3_BUCKET` and `AWS_REGION` in `server/.env`; confirm the role is attached (EC2 → instance → Actions → Security → Modify IAM role); confirm the bucket name in the IAM policy; then `pm2 restart cloudvault-api` |
| Upload fails with "Upload to cloud storage failed" | The IAM policy's object resource must end with `/*` |
| Site does not load | The security group must allow inbound HTTP on port 80; check `pm2 status` and `sudo systemctl status nginx` |
| `502 Bad Gateway` | The API is not running: `pm2 logs cloudvault-api` |
| `413 Request Entity Too Large` | Raise `client_max_body_size` in `deploy/nginx.conf`, copy it to `/etc/nginx/sites-available/cloudvault`, and run `sudo systemctl restart nginx` |
| Setup script stops at `npm ci` | Run it again; the swap file prevents most memory errors on small instances |
| Changes to `server/.env` not applied | `pm2 restart cloudvault-api` |

## 15. Results

- Users can register, log in and manage files from any browser.
- Files are stored durably in Amazon S3 (designed for 99.999999999% durability) and never on the EC2 disk.
- No AWS credentials exist in the source code or on the server.
- Downloads are served directly by S3, reducing load on the EC2 instance.

## 16. Conclusion and Future Scope

CloudVault demonstrates a secure, cloud-native file storage system that combines Amazon S3 for durable storage, Amazon EC2 for compute, and AWS IAM for credential-free, least-privilege access.

Possible enhancements:

- HTTPS with a custom domain (Route 53 and Let's Encrypt, or an Application Load Balancer with ACM)
- Amazon CloudFront CDN for faster global downloads
- Direct browser-to-S3 uploads using pre-signed PUT URLs for very large files
- File sharing with time-limited public links
- Amazon RDS or DynamoDB instead of SQLite for multi-server scaling
- Amazon Cognito for managed authentication and multi-factor login
- Amazon CloudWatch for monitoring and alarms
- Storage quotas per user and S3 lifecycle rules (e.g. move old files to S3 Glacier)

## 17. Cleanup (Avoid Charges After Evaluation)

1. **EC2:** terminate the `cloudvault-server` instance.
2. **S3:** empty the bucket, then delete it.
3. **IAM:** delete the `CloudVaultEC2Role` role and the `CloudVaultS3Access` policy.
