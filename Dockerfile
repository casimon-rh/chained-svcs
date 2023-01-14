FROM node:16
WORKDIR /app
COPY . .
RUN npm i && npm run build
CMD npm start