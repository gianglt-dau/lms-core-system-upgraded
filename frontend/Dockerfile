# Use an official Node.js image as the base
FROM node:18-alpine

# Build-time argument để truyền VITE_API_URL vào lúc build
ARG VITE_API_URL=http://localhost:5000
ARG VITE_PORT=5173
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_PORT=$VITE_PORT

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the frontend với VITE_API_URL đã được nhúng vào bundle
RUN npm run build

# Expose port
EXPOSE $VITE_PORT

# Start the app
CMD ["npm", "run", "preview:build"]
