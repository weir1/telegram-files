import re
import sys
import subprocess

# 文件路径
VERSION_FILE = "VERSION"
BUILD_GRADLE_FILE = "api/build.gradle"
JAVA_VERSION_FILE = "api/src/main/java/telegram/files/Start.java"
PACKAGE_JSON_FILE = "web/package.json"

def read_version():
    """读取 VERSION 文件中的版本号"""
    with open(VERSION_FILE, "r") as file:
        return file.read().strip()

def write_version(version):
    """将版本号写入 VERSION 文件"""
    with open(VERSION_FILE, "w") as file:
        file.write(version + "\n")

def update_build_gradle(version):
    """更新 build.gradle 中的版本号"""
    with open(BUILD_GRADLE_FILE, "r") as file:
        content = file.read()

    # 使用正则表达式匹配 version = "x.y.z"
    updated_content = re.sub(r'version\s*=\s*\'.*?\'', f'version = \'{version}\'', content)

    with open(BUILD_GRADLE_FILE, "w") as file:
        file.write(updated_content)

def update_java_version(version):
    """更新 Start.java 中的版本号"""
    with open(JAVA_VERSION_FILE, "r") as file:
        content = file.read()

    # 使用正则表达式匹配 version = "x.y.z"
    updated_content = re.sub(r'VERSION\s*=\s*".*?"', f'VERSION = "{version}"', content)

    with open(JAVA_VERSION_FILE, "w") as file:
        file.write(updated_content)

def update_package_json(version):
    """更新 package.json 中的版本号"""
    with open(PACKAGE_JSON_FILE, "r") as file:
        content = file.read()

    # 使用正则表达式匹配 "version": "x.y.z"
    updated_content = re.sub(r'"version"\s*:\s*".*?"', f'"version": "{version}"', content)

    with open(PACKAGE_JSON_FILE, "w") as file:
        file.write(updated_content)

def git_commit_and_tag(version, message):
    """执行 Git 提交并创建标签"""
    try:
        # 添加修改到 Git 暂存区
        subprocess.run(["git", "add", VERSION_FILE, BUILD_GRADLE_FILE, PACKAGE_JSON_FILE], check=True)
        # 提交修改
        subprocess.run(["git", "commit", "-m", message], check=True)
        # 创建标签
        subprocess.run(["git", "tag", version], check=True)
        print(f"已成功提交修改并创建标签：{version}")
    except subprocess.CalledProcessError as e:
        print(f"Git 操作失败: {e}")
        sys.exit(1)

def main():
    # 获取命令行参数中的版本号
    version = sys.argv[1] if len(sys.argv) > 1 else None

    if version is None:
        print("请提供版本号，例如：python update_version.py 1.2.3")
        sys.exit(1)

    # 输入变更内容
    change_message = input("请输入版本变更内容: ").strip()

    # 更新 VERSION 文件
    write_version(version)

    # 更新 build.gradle、java 和 package.json
    update_build_gradle(version)
    update_java_version(version)
    update_package_json(version)

    print(f"版本号已更新为：{version}")

    if change_message:
        # 提交到 Git 并创建标签
        git_commit_and_tag(version, change_message)

if __name__ == "__main__":
    main()
