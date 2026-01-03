\# Donation App Backend



\## Setup Instructions



\### 1. Install Dependencies

```bash

npm install

```



\### 2. Environment Variables

Create a `.env` file in the root directory:

```bash

cp .env.example .env

```



Then fill in your actual values:

\- MongoDB Atlas connection string

\- AWS S3 credentials

\- JWT secret



\### 3. Run the Server

```bash

npm start

```



Server will run on `http://localhost:5000`



\## Environment Variables Required



\- `MONGODB\_URI` - MongoDB Atlas connection string

\- `AWS\_ACCESS\_KEY\_ID` - AWS IAM access key

\- `AWS\_SECRET\_ACCESS\_KEY` - AWS IAM secret key

\- `AWS\_REGION` - AWS region (e.g., us-east-1)

\- `S3\_BUCKET\_NAME` - S3 bucket name for images

\- `JWT\_SECRET` - Secret for JWT tokens

\- `PORT` - Server port (default: 5000)

