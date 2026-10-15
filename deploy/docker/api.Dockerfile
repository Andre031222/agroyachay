# Build context: ../api (see deploy/docker-compose.yml)
FROM rust:1-bookworm AS build
WORKDIR /src
COPY Cargo.toml Cargo.lock ./
COPY src ./src
COPY migrations ./migrations
RUN cargo build --release --locked

FROM debian:bookworm-slim
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates tzdata \
 && rm -rf /var/lib/apt/lists/* \
 && useradd --system --uid 10001 --home /app agroyachay
WORKDIR /app
COPY --from=build /src/target/release/agroyachay-api /app/agroyachay-api
COPY --from=build /src/migrations /app/migrations
RUN mkdir -p /app/uploads && chown agroyachay:agroyachay /app/uploads
USER agroyachay
ENV PORT=9001 UPLOAD_DIR=/app/uploads RUST_LOG=info
EXPOSE 9001
CMD ["/app/agroyachay-api"]
