FROM debian:trixie-slim
RUN apt-get update && apt-get install -y nginx
COPY ./nginx.conf /etc/nginx/nginx.conf
WORKDIR /app
EXPOSE 80
COPY ./css ./web/css
COPY ./js ./web/js
COPY ./index.html ./web/
CMD ["nginx", "-g", "daemon off;"]
#CMD ["bash"]
