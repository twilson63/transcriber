# Use Node.js LTS (Long Term Support) as base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy TypeScript configuration
COPY tsconfig.json ./

# Copy source code
COPY src ./src

# Build TypeScript code
RUN npm install typescript && npm run build

# Remove devDependencies and build tools
RUN npm prune --production && npm uninstall typescript

# Expose port (will be set by PORT env variable)
EXPOSE 3000

# Set default environment to production
ENV NODE_ENV=production

# Run the application
CMD ["npm", "start"]
