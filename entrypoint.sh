#!/bin/bash

lib_path="/app/tdlib"
if [ ! -d "$lib_path" ]; then
  echo "Downloading TDLib..."
  mkdir -p $lib_path
  wget --no-check-certificate -q -O libs.zip https://github.com/p-vorobyev/spring-boot-starter-telegram/releases/download/1.15.0/libs.zip
  unzip -q libs.zip -d $lib_path
  rm libs.zip
fi

# libs has linux_arm64 linux_x64
case $(uname -m) in
  x86_64)
    lib_path="$lib_path/libs/linux_x64"
    ;;
  aarch64)
    lib_path="$lib_path/libs/linux_arm64"
    ;;
  *)
    echo "Unsupported architecture: $(uname -m)"
    exit 1
    ;;
esac

echo "Using TDLib from $lib_path"

# start services
java -jar -Djava.library.path=$lib_path /app/api.jar \
  & pm2 start /app/web/pm2.json --no-daemon \
  & nginx -g 'daemon off;'

