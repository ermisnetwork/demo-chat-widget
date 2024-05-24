FROM node:18.20.3-alpine3.18 as build

WORKDIR /app

COPY package*.json ./

RUN yarn install

COPY . .

# RUN yarn build

EXPOSE 3000

ENTRYPOINT [ "yarn", "start" ]