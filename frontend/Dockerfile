# Use an official Node.js image as the base
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the frontend (assuming Vite is used)
RUN npm run build

# Expose the port Vite serves on (default 5173)
EXPOSE 5173

# Start the app (use preview for production build)
CMD ["npm", "run", "preview"]
