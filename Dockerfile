# Multi-stage build — three stages keeps the final image small:
#   deps    → install node_modules (cached separately)
#   builder → compile Next.js
#   runner  → minimal runtime image, no build tools

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# Install ALL deps (including devDeps like tailwind) — needed at build time
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
# Copy deps from previous stage, then source
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build args are injected at build time (not baked into image as plaintext)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV BUILD_STANDALONE=1
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# standalone output is a self-contained server — no node_modules needed
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
