# Stage 1: Build Phase
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency configurations
COPY package*.json ./

# Install clean node modules
RUN npm ci

# Copy whole repository workspace files
COPY . .

# Run compiler build to output production files into dist/
RUN npm run build

# Stage 2: Production Safe Serving Phase
FROM node:20-alpine AS runner

WORKDIR /app

# Install secure lightweight serving package
RUN npm install -g serve

# Copy compiled SPA assets from Stage 1
COPY --from=builder /app/dist ./dist

# Hugging Face Spaces port binding configuration
EXPOSE 7860

# On startup, dynamically extract standard container secrets and dump them into dist/env-config.js 
# to keep secrets out of compiled files, and then boot the static server on 7860.
CMD ["sh", "-c", "echo \"window.env = { GROQ_API_KEY: '${GROQ_API_KEY}', GEMINI_API_KEY: '${GEMINI_API_KEY}', OPENAI_API_KEY: '${OPENAI_API_KEY}', DEEPSEEK_API_KEY: '${DEEPSEEK_API_KEY}' };\" > dist/env-config.js && serve -s dist -l 7860"]
