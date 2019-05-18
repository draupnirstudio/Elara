FROM node:10-slim as Builder

USER node

RUN mkdir -p /home/node/app

WORKDIR /home/node/app

COPY --chown=node package.json ./
COPY --chown=node package-lock.json .
RUN npm install

COPY --chown=node . .

RUN npm run build

FROM nginx

ENV HOST=0.0.0.0 PORT=3000

EXPOSE ${PORT}

COPY ./nginx/default.nginx /etc/nginx/conf.d/default.conf

COPY --from=builder /home/node/app/build/ /usr/share/nginx/html
