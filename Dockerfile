# ── Stage 1: Install all dependencies ─────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
# ci install ensures the lockfile is respected exactly
RUN npm ci

# ── Stage 2: Build the Next.js application ────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* variables are inlined at build time.
# Pass the public backend URL so browser-side fetches work correctly.
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# ── Stage 3: Minimal production runner ────────────────────
# next build with output: "standalone" produces a self-contained server
# that includes only the node_modules it actually needs.
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy the standalone server bundle
COPY --from=builder /app/.next/standalone ./

# Copy compiled static assets into the expected location
COPY --from=builder /app/.next/static ./.next/static

# Copy public assets (images, icons, etc.)
COPY --from=builder /app/public ./public

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
