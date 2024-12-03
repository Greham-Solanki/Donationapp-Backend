FROM node:18-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

COPY global-bundle.pem /config/global-bundle.pem

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Expose the correct port for your backend
EXPOSE 5000

# Start the application
CMD ["node", "server.js"]
