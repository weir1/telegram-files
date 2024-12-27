# 多阶段构建：第一阶段用于构建 API 应用程序
FROM gradle:8.10-jdk21-alpine AS api-builder

# 设置工作目录
WORKDIR /app

# 将 API 项目的所有文件拷贝到容器中
COPY ./api .

# 使用 Gradle 构建项目
RUN gradle shadowJar --no-daemon

# 提取构建的 jar 文件
RUN mkdir -p /app/build/libs && \
    cp /app/build/libs/*.jar /app/api.jar

# 使用 jdeps 分析依赖
RUN jdeps --print-module-deps --ignore-missing-deps /app/api.jar > /app/dependencies.txt

# 第二阶段：创建定制化的 JRE
FROM openjdk:21-jdk-slim AS runtime-builder

# 设置工作目录
WORKDIR /custom-jre

# 通过 jlink 创建最小化的 JRE
COPY --from=api-builder /app/dependencies.txt /custom-jre/dependencies.txt
RUN apt-get update && apt-get install binutils -y && \
  jlink \
    --add-modules $(cat /custom-jre/dependencies.txt) \
    --output /custom-jre/jre \
    --strip-debug \
    --no-man-pages \
    --no-header-files \
    --compress=2

# 第三阶段：构建 Web 前端
FROM node:21 AS web-builder

ENV NEXT_PUBLIC_API_URL=/api
ENV NEXT_PUBLIC_WS_URL=/ws
ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_ENV_VALIDATION=1

# 设置工作目录
WORKDIR /web

# 安装依赖
COPY ./web/package.json ./web/package-lock.json ./
RUN npm install --frozen-lockfile

# 将 Web 项目的所有文件拷贝到容器中
COPY ./web .

# 构建 Next.js 应用
RUN npm run build

# 第四阶段：最终运行镜像
FROM node:21-slim AS final

WORKDIR /app

RUN npm install pm2 -g \
    && apt-get update && apt-get install -y --no-install-recommends nginx wget curl unzip \
    && if [ "$(uname -m)" = "x86_64" ]; then \
        wget http://nz2.archive.ubuntu.com/ubuntu/pool/main/o/openssl/libssl1.1_1.1.1f-1ubuntu2.23_amd64.deb && \
        dpkg -i libssl1.1_1.1.1f-1ubuntu2.23_amd64.deb && \
        rm libssl1.1_1.1.1f-1ubuntu2.23_amd64.deb; \
    elif [ "$(uname -m)" = "aarch64" ]; then \
        wget http://ports.ubuntu.com/pool/main/o/openssl/libssl1.1_1.1.1f-1ubuntu2_arm64.deb && \
        dpkg -i libssl1.1_1.1.1f-1ubuntu2_arm64.deb && \
        rm libssl1.1_1.1.1f-1ubuntu2_arm64.deb; \
    else \
        echo "Unsupported architecture: $(uname -m)"; \
        exit 1; \
    fi \
    && apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*;

# 拷贝定制化的 JRE
COPY --from=runtime-builder /custom-jre/jre /jre

# 设置环境变量
ENV JAVA_HOME=/jre
ENV PATH="$JAVA_HOME/bin:$PATH"

# 拷贝 API 应用程序
COPY --from=api-builder /app/api.jar /app/api.jar

# 拷贝 Web 前端静态文件到 nginx
COPY --from=web-builder /web/public /app/web/public
COPY --from=web-builder /web/.next/standalone /app/web/
COPY --from=web-builder /web/.next/static /app/web/.next/static

COPY ./web/pm2.json /app/web/pm2.json
COPY ./entrypoint.sh ./entrypoint.sh
COPY ./nginx.conf /etc/nginx/nginx.conf

# 暴露服务端口
EXPOSE 80

# 启动服务
CMD ["/bin/sh", "./entrypoint.sh"]
