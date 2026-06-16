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

# Install secure lightweight serving package (high performance static hosting)
RUN npm install -g serve

# Copy compiled SPA assets from Stage 1
COPY --from=builder /app/dist ./dist

# Hugging Face Spaces port binding configuration
EXPOSE 7860

# On container startup, dynamically extract runtime secrets assigned in HF "Settings -> Variables and secrets"
# and write them to dist/env-config.js. This exposes them to window.__ENV in the browser without baking sensitive keys in the static build.
CMD ["sh", "-c", "echo \"window.__ENV = { GROQ_API_KEY: '${GROQ_API_KEY}', GEMINI_API_KEY: '${GEMINI_API_KEY}', OPENAI_API_KEY: '${OPENAI_API_KEY}', DEEPSEEK_API_KEY: '${DEEPSEEK_API_KEY}' }; window.env = window.__ENV;\" > dist/env-config.js && serve -s dist -l 7860"]
