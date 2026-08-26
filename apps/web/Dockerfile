# DealStoker Web — Railway / container image
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Rewrites in next.config.ts bake API_BASE_URL at build time.
ARG API_BASE_URL=http://localhost:8080
ARG NEXT_PUBLIC_SITE_URL=https://dealstoker.com
ENV API_BASE_URL=$API_BASE_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -S dealstoker && adduser -S dealstoker -G dealstoker

COPY --from=build /app/public ./public
COPY --from=build --chown=dealstoker:dealstoker /app/.next/standalone ./
COPY --from=build --chown=dealstoker:dealstoker /app/.next/static ./.next/static

USER dealstoker
EXPOSE 3000

CMD ["node", "server.js"]
