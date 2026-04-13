# BHARAT JANSETU BACKEND V2 - PRODUCTION
# HANDLES 75 DISTRICT JURISDICTIONAL DATA ISOLATION

FROM node:20-slim

WORKDIR /app

# Ensure we have the production dependencies only to reduce image size
COPY package*.json ./
RUN npm install --omit=dev

# Copy the rest of the application
COPY . .

# Set environment variables (should be overridden by docker-compose or Kubernetes secrets)
ENV PORT 5000
ENV NODE_ENV production

# Expose the API port
EXPOSE 5000

# Start the production server
CMD ["npm", "start"]
