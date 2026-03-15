FROM node:20-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npx tsc

FROM debian:trixie-slim
RUN apt-get update && apt-get install -y nginx
COPY ./nginx.conf /etc/nginx/nginx.conf
WORKDIR /app
EXPOSE 80
COPY ./css ./web/css
COPY --from=build /app/dist ./web/dist
COPY ./index.html ./web/
CMD ["nginx", "-g", "daemon off;"]
