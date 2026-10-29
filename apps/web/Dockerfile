# Build context: repository root.
#   docker build -f apps/web/Dockerfile --build-arg VITE_API_URL=https://api.example.com .

FROM oven/bun:1.4.4-alpine AS prune
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY . .
RUN bunx turbo@2.11.10 prune web --docker

FROM oven/bun:1.4.4-alpine AS build
WORKDIR /app
COPY --from=prune /app/out/json/ .
RUN bun install --frozen-lockfile --ignore-scripts
COPY --from=prune /app/out/full/ .

ARG VITE_API_URL
ARG VITE_SENTRY_DSN=
RUN test -n "$VITE_API_URL" || (echo "VITE_API_URL build arg is required" >&2 && exit 1)
ENV VITE_API_URL=$VITE_API_URL VITE_SENTRY_DSN=$VITE_SENTRY_DSN TURBO_TELEMETRY_DISABLED=1
RUN bunx turbo run build --filter=web

# Same origin the bundle calls is the only API origin the CSP allows.
RUN API_ORIGIN=$(echo "$VITE_API_URL" | sed -E 's#^(https?://[^/]+).*#\1#') \
  && sed "s#__API_ORIGIN__#${API_ORIGIN}#" apps/web/nginx/default.conf > /app/nginx.conf

FROM nginx:1.30.6-alpine
COPY --from=build /app/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
RUN nginx -t
EXPOSE 80
