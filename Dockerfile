FROM node:dubnium-slim

WORKDIR /usr/src/app
RUN npm install yarn

COPY package.json .
COPY yarn.lock .
RUN yarn

COPY . .
RUN yarn build
RUN yarn --production

EXPOSE 8080
CMD ["node", "."]
