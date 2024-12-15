1. **安装命令行工具**：
   ```bash
   xcode-select --install
   ```
   安装 macOS 的命令行开发工具（包括 `clang`、`make` 等）。

2. **安装 Homebrew**：
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```
   下载并安装 Homebrew，一个包管理器，用于安装依赖软件。

3. **安装必要的软件包**：
   ```bash
   brew install gperf cmake openssl coreutils
   brew install openjdk
   ```
    - `gperf`：生成完美哈希函数的工具。
    - `cmake`：跨平台的构建工具。
    - `openssl`：用于安全通信的加密库。
    - `coreutils`：GNU 核心实用工具，提供了 `greadlink` 等命令。
    - `openjdk`：Java 开发工具包。

4. **克隆 TDLib 仓库**：
   ```bash
   git clone https://github.com/tdlib/td.git
   cd td
   ```
   下载 TDLib 的源码。

5. **创建和清理构建目录**：
   ```bash
   rm -rf build
   mkdir build
   cd build
   ```
   确保构建环境干净无误。

6. **配置和构建库**：
   ```bash
   cmake -DCMAKE_BUILD_TYPE=Release -DJAVA_HOME=/opt/homebrew/opt/openjdk/libexec/openjdk.jdk/Contents/Home/ -DOPENSSL_ROOT_DIR=/opt/homebrew/opt/openssl/ -DCMAKE_INSTALL_PREFIX:PATH=../example/java/td -DTD_ENABLE_JNI=ON ..
   cmake --build . --target install
   ```
    - `-DCMAKE_BUILD_TYPE=Release`：构建为发布版本。
    - `-DJAVA_HOME` 和 `-DOPENSSL_ROOT_DIR`：指定 OpenJDK 和 OpenSSL 的路径。
    - `-DCMAKE_INSTALL_PREFIX`：指定安装路径。
    - `-DTD_ENABLE_JNI=ON`：启用 Java JNI 接口。
    - 构建并安装到指定目录。

7. **构建 Java 示例项目**：
   ```bash
   cd ..
   cd example/java
   rm -rf build
   mkdir build
   cd build
   cmake -DCMAKE_BUILD_TYPE=Release -DJAVA_HOME=/opt/homebrew/opt/openjdk/libexec/openjdk.jdk/Contents/Home/ -DCMAKE_INSTALL_PREFIX:PATH=../../../tdlib -DTd_DIR:PATH=$(greadlink -e ../td/lib/cmake/Td) ..
   cmake --build . --target install
   ```
   使用 TDLib 构建 Java 示例程序，`-DTd_DIR` 指向 TDLib 的 cmake 文件路径。

8. **验证安装结果**：
   ```bash
   cd ../../..
   cd ..
   ls -l td/tdlib
   ```
   查看生成的文件是否存在，确认构建和安装是否成功。

完成以上步骤后，`td/tdlib` 目录下应该包含构建好的库文件。
