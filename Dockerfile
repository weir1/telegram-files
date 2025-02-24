FROM gradle:8.10-jdk21-alpine AS api-builder

WORKDIR /app

COPY ./api/build.gradle ./api/settings.gradle ./
COPY ./api/gradle ./gradle
RUN gradle dependencies --no-daemon

COPY ./api .
RUN gradle shadowJar --no-daemon && \
    mkdir -p /app/build/libs && \
    cp /app/build/libs/*.jar /app/api.jar && \
    jdeps --print-module-deps --ignore-missing-deps /app/api.jar > /app/dependencies.txt

FROM openjdk:21-jdk-slim AS runtime-builder

WORKDIR /custom-jre

COPY --from=api-builder /app/dependencies.txt .
RUN apt-get update && \
    apt-get install -y --no-install-recommends binutils && \
    jlink \
        --add-modules $(cat dependencies.txt) \
        --output jre \
        --strip-debug \
        --no-man-pages \
        --no-header-files \
        --compress=2 && \
    apt-get purge -y binutils && \
    apt-get autoremove -y && \
    rm -rf /var/lib/apt/lists/*

FROM node:21-alpine AS web-builder

WORKDIR /web

ENV NEXT_PUBLIC_API_URL=/api \
    NEXT_PUBLIC_WS_URL=/ws \
    NEXT_TELEMETRY_DISABLED=1 \
    SKIP_ENV_VALIDATION=1

COPY ./web/package*.json ./
RUN npm ci --frozen-lockfile

COPY ./web .
RUN npm run build

FROM node:21-slim AS final

WORKDIR /app

ARG LIB_PATH=/app/tdlib
ENV JAVA_HOME=/jre \
    PATH="/jre/bin:$PATH" \
    LANG=C.UTF-8 \
    NGINX_PORT=80

RUN npm install -g pm2 && \
    apt-get update && \
    apt-get install -y --no-install-recommends nginx wget curl unzip tini gosu gettext && \
    mkdir -p $LIB_PATH && \
    wget --no-check-certificate -q -O libs.zip https://github.com/p-vorobyev/spring-boot-starter-telegram/releases/download/1.15.0/libs.zip && \
    unzip -q libs.zip -d /tmp/tdlib && \
    if [ "$(uname -m)" = "x86_64" ]; then \
        mv /tmp/tdlib/libs/linux_x64/* $LIB_PATH && \
        wget http://nz2.archive.ubuntu.com/ubuntu/pool/main/o/openssl/libssl1.1_1.1.1f-1ubuntu2.24_amd64.deb && \
        dpkg -i libssl1.1_1.1.1f-1ubuntu2.24_amd64.deb && \
        rm libssl1.1_1.1.1f-1ubuntu2.24_amd64.deb; \
    elif [ "$(uname -m)" = "aarch64" ]; then \
        mv /tmp/tdlib/libs/linux_arm64/* $LIB_PATH && \
        wget http://ports.ubuntu.com/pool/main/o/openssl/libssl1.1_1.1.1f-1ubuntu2_arm64.deb && \
        dpkg -i libssl1.1_1.1.1f-1ubuntu2_arm64.deb && \
        rm libssl1.1_1.1.1f-1ubuntu2_arm64.deb; \
    else \
        echo "Unsupported architecture: $(uname -m)" && \
        exit 1; \
    fi && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* ./libs.zip && \
    touch /run/nginx.pid && \
    chown -R 1000:1000 /app /etc/nginx /var/lib/nginx /var/log/nginx /run/nginx.pid && \
    echo '#!/bin/sh\njava -Djava.library.path=/app/tdlib -cp /app/api.jar telegram.files.Maintain "$@"' > /usr/bin/tfm && \
    chmod +x /usr/bin/tfm

COPY --from=runtime-builder --chown=1000:1000 /custom-jre/jre /jre
COPY --from=api-builder --chown=1000:1000 /app/api.jar /app/api.jar
COPY --from=web-builder --chown=1000:1000 /web/public /app/web/public
COPY --from=web-builder --chown=1000:1000 /web/.next/standalone /app/web/
COPY --from=web-builder --chown=1000:1000 /web/.next/static /app/web/.next/static

COPY --chown=1000:1000 ./web/pm2.json /app/web/
COPY --chown=1000:1000 ./entrypoint.sh .
COPY --chown=1000:1000 ./nginx.conf.template /etc/nginx/nginx.conf.template

EXPOSE 80

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["/bin/sh", "./entrypoint.sh"]
