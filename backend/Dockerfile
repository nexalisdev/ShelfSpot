# Build stage
FROM rust:1.82-slim-bookworm AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*

# Copy manifests first for layer caching
COPY Cargo.toml Cargo.lock* ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release 2>/dev/null || true
RUN rm src/main.rs

# Copy source
COPY src ./src

# Build
RUN cargo build --release

# Runtime stage
FROM debian:bookworm-slim AS runtime

RUN apt-get update && apt-get install -y ca-certificates libssl3 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/target/release/shelfspot /app/shelfspot

EXPOSE 3001

CMD ["/app/shelfspot"]
