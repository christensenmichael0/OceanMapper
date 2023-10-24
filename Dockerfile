# base
FROM node:14.17.5 AS base

WORKDIR /usr/src/app

COPY . .

COPY package*.json ./

RUN echo $(npm install --unsafe-perm)


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

RUN echo $(npm install --unsafe-perm)

RUN npm run build


# for production

FROM node:14.17.5-alpine3.13

WORKDIR /usr/src/app

COPY package*.json ./

COPY --from=builder /usr/src/app/client/build ./client/build
COPY --from=builder /usr/src/app/server ./server

# Note: the script name is install so we must use npm run install (or else we end up in infinite loop)
# RUN echo $(npm run install-deps --unsafe-perm)

EXPOSE 3001

ENTRYPOINT ["npm", "run", "start:prod"]
