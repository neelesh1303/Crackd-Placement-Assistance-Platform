# 1. Start from a small image that already has Node 20 installed
FROM node:20-alpine

# 2. All commands below run inside /app in the container
WORKDIR /app

# 3. Copy only package files first -> Docker caches npm install if they don't change
COPY package*.json ./
RUN npm ci --omit=dev

# 4. Copy the rest of the backend code
COPY . .

# 5. Run in production mode, the app listens on port 5000
ENV NODE_ENV=production
EXPOSE 5000

# 6. Command that starts the server
CMD ["npm", "start"]
