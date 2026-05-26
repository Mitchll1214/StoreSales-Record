FROM node:20-slim

WORKDIR /app

# Debian 阿里云镜像（加速 apt 下载）
RUN sed -i 's|deb.debian.org|mirrors.aliyun.com|g' /etc/apt/sources.list.d/debian.sources

# 安装编译工具 + SQLite 开发库（编译 sqlite3 原生模块用）
RUN apt-get update \
    && apt-get install -y python3 make g++ libsqlite3-dev \
    && rm -rf /var/lib/apt/lists/*

# npm 淘宝镜像
RUN npm config set registry https://registry.npmmirror.com

# 分层缓存：先复制依赖描述文件
COPY package.json package-lock.json ./

# 跳过 GitHub 预编译二进制下载（设一个本地无效地址，秒失败 → 直接走源码编译）
ENV npm_config_sqlite3_binary_host_mirror=http://127.0.0.1:1/
ENV npm_config_sqlite3_binary_site=http://127.0.0.1:1/

# 编译安装依赖（sqlite3 从源码编译，不走 GitHub 下载）
RUN npm ci --omit=dev

# 清理编译工具（保留 libsqlite3-0 运行时库）
RUN apt-get purge -y python3 make g++ \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*

# 再复制源码
COPY . .

EXPOSE 3000

CMD ["node", "src/app.js"]
