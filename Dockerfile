# Use Node.js LTS (Long Term Support) as base image
FROM node:20-alpine

# Install build tools, yt-dlp, and its dependencies
RUN apk add --no-cache python3 py3-pip ffmpeg build-base && \
    pip3 install --break-system-packages yt-dlp

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm install

# Copy TypeScript configuration
COPY tsconfig.json ./

# Copy source code
COPY src ./src

# Build TypeScript code
RUN npm run build

# Remove devDependencies to reduce image size
RUN npm prune --production

# Expose port (will be set by PORT env variable)
EXPOSE 3000

# Set default environment to production
ENV NODE_ENV=production

# Run the application
CMD ["npm", "start"]
