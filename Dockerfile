# Use an official Node runtime as the base image
FROM public.ecr.aws/docker/library/node:18-alpine

# Set working directory in the container
WORKDIR /usr/src/app

# Create config directory
RUN mkdir -p /config

# Copy the global-bundle.pem from the config folder
COPY global-bundle.pem /config/global-bundle.pem

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 5000

# Command to run the application
CMD ["npm", "start"]
