# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy source code and build
COPY . .
# We can set Vite env vars here if needed during build time
# However, Vite embeds env vars at build time, so for Docker we either build per env
# or inject it at runtime. Since this is an SPA, typical simple approach is build-time var.
# The user wants VITE_API_URL to be configurable. 
# We'll use ARG to pass it during docker-compose build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Run stage
FROM nginx:alpine
# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
