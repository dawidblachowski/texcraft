# Stage 1: Frontend Build
FROM node:22 as frontend-builder

WORKDIR /app/frontend

COPY frontend/package.json frontend/yarn.lock ./
RUN yarn install
COPY frontend/ ./

RUN yarn run build


# Stage 2: Backend Build
FROM node:22 as backend-builder

WORKDIR /app/backend

COPY backend/package.json backend/yarn.lock ./
RUN yarn install
COPY backend/ ./

RUN yarn run prisma-generate
RUN yarn run swagger
RUN yarn run build

# Stage 3: Final Image
FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=UTC

RUN apt-get update \
    && apt-get install -y software-properties-common \
    && add-apt-repository universe \
    && apt-get update \
    && apt-get install -y curl texlive-full \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs
    
RUN npm install -g yarn

WORKDIR /app
COPY --from=backend-builder /app/backend/dist ./
COPY --from=frontend-builder /app/frontend/dist ./public

COPY backend/package.json ./
COPY backend/yarn.lock ./
COPY backend/prisma ./prisma 

RUN yarn install --production

RUN yarn prisma generate

COPY ./start.sh ./
RUN chmod +x ./start.sh

EXPOSE 3000
CMD ["./start.sh"]