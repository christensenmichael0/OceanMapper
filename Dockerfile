# base
FROM node:14.17.5 AS base

WORKDIR /usr/src/app

COPY . .

COPY package*.json ./

RUN echo $(npm i --unsafe-perm)

#COPY . .

# -- NOT IMPLEMENTED -- #
# for lint

#FROM base as linter
#
#WORKDIR /usr/src/app
#
#RUN npm run lint

# for build

FROM base as builder

WORKDIR /usr/src/app

COPY package*.json ./

RUN echo $(npm run install-deps --unsafe-perm)

RUN npm run build


# for production

FROM node:14.17.5-alpine3.13

WORKDIR /usr/src/app

COPY package*.json ./

COPY --from=builder /usr/src/app/client/build ./client/build
COPY --from=builder /usr/src/app/server ./server

RUN echo $(npm run install-deps --unsafe-perm --production-only)

EXPOSE 80

ENTRYPOINT ["npm", "run", "start:prod"]
