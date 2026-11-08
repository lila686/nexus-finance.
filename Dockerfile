FROM alpine:3.13
RUN apk add --update --no-cache nodejs npm
WORKDIR /app
COPY package*.json ./
RUN npm config set registry https://mirrors.cloud.tencent.com/npm/
RUN npm install
COPY . .
EXPOSE 8080
CMD ["npm", "start"]