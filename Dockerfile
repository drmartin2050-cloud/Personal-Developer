# Production ready multishield container deployment Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency configs
COPY package*.json ./

# Install clean dependencies
RUN npm ci

# Copy full workspace files
COPY . .

# Run build package to compile Vite assets
RUN npm run build

# Stage 2: Serve compiled static assets
FROM node:20-alpine AS runner

WORKDIR /app

# Install simple, lightweight secure static server
RUN npm install -g serve

# Copy compiled files from builder
COPY --from=builder /app/dist ./dist

# Standard container ingress port config
EXPOSE 3000

# Start serve production on port 3050 - mapped internally or directly on 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
