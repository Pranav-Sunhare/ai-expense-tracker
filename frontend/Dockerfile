# Stage 1: Build React App with Node 22
FROM node:22-alpine AS build
WORKDIR /app

# Dependencies copy & install
COPY package*.json ./
RUN npm install

# Source code copy & build
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]