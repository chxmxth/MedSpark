FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Production image
FROM node:22-alpine

WORKDIR /app

# Copy the built artifacts and production dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
# Only install production dependencies for a smaller image
RUN npm ci --omit=dev

# Expose the port Cloud Run expects
EXPOSE 3000

# Start the server
CMD ["npm", "start"]
