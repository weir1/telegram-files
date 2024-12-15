<p align="center">
    <img src="./web/public/favicon.svg" align="center" width="30%">
</p>
<p align="center"><h1 align="center">Telegram Files</h1></p>
<p align="center">
	<em><code>A simple telegram file downloader.</code></em>
</p>
<p align="center">
	<img src="https://img.shields.io/github/license/jarvis2f/telegram-files?style=default&logo=opensourceinitiative&logoColor=white&color=0080ff" alt="license">
	<img src="https://img.shields.io/github/last-commit/jarvis2f/telegram-files?style=default&logo=git&logoColor=white&color=0080ff" alt="last-commit">
	<img src="https://img.shields.io/github/languages/top/jarvis2f/telegram-files?style=default&color=0080ff" alt="repo-top-language">
	<img src="https://img.shields.io/github/languages/count/jarvis2f/telegram-files?style=default&color=0080ff" alt="repo-language-count">
</p>
<br>

## 🔗 Table of Contents

- [📍 Overview](#-overview)
- [🧩 Screenshots](#-screenshots)
- [🚀 Getting Started](#-getting-started)
    - [☑️ Prerequisites](#-prerequisites)
    - [⚙️ Installation](#-installation)
    - [🤖 Usage](#🤖-usage)
- [📌 Project Roadmap](#-project-roadmap)
- [🔰 Contributing](#-contributing)
- [🎗 License](#-license)

---

## 📍 Overview

* Support for downloading files from telegram channels and groups.
* Support multiple telegram accounts for downloading files.
* Support suspending and resuming downloads.
* Multiple accounts with same files will be downloaded only once.

---

## 🧩 Screenshots

<p align="center">
    <img src="./misc/screenshot.png" align="center" width="80%">
</p>

## 🚀 Getting Started

### ☑️ Prerequisites

Before getting started with telegram-files, ensure your runtime environment meets the following requirements:

- **Programming Language:** JDK21,TypeScript
- **Package Manager:** Gradle,Npm
- **Container Runtime:** Docker

### ⚙️ Installation

Install telegram-files using one of the following methods:

**Build from source:**

1. Clone the telegram-files repository:

```sh
git clone https://github.com/jarvis2f/telegram-files
```

2. Navigate to the project directory:

```sh
cd telegram-files
```

3. Install the project dependencies:

**Using `npm`**
&nbsp; [<img align="center" src="https://img.shields.io/badge/npm-CB3837.svg?style={badge_style}&logo=npm&logoColor=white" />](https://www.npmjs.com/)

```sh
cd web
npm install
```

**Using `gradle`**
&nbsp; [<img align="center" src="https://img.shields.io/badge/Gradle-02303A.svg?style={badge_style}&logo=gradle&logoColor=white" />](https://gradle.org/)

```sh
cd api
gradle build
```

**Using `docker`**
&nbsp; [<img align="center" src="https://img.shields.io/badge/Docker-2CA5E0.svg?style={badge_style}&logo=docker&logoColor=white" />](https://www.docker.com/)

```sh
docker build -t jarvis2f/telegram-files .
```

### 🤖 Usage

**Using `docker`**
&nbsp; [<img align="center" src="https://img.shields.io/badge/Docker-2CA5E0.svg?style={badge_style}&logo=docker&logoColor=white" />](https://www.docker.com/)

Copy [docker-compose.yaml](docker-compose.yaml) to your project directory and run the following command:

```sh
docker-compose up -d
```

> **Important Note:** You should NOT expose the service to the public internet. Because the service is not secure.
---

## 📌 Project Roadmap

- [ ] **`Task 1`**: Improve Telegram’s login functionality.
- [ ] **`Task 2`**: Support auto transfer files to other destinations.
- [ ] **`Task 3`**: Automatically download files based on set rules.
- [ ] **`Task 4`**: Download statistics and reports.

---

## 🔰 Contributing

- **💬 [Join the Discussions](https://github.com/jarvis2f/telegram-files/discussions)**: Share your insights, provide
  feedback, or ask questions.
- **🐛 [Report Issues](https://github.com/jarvis2f/telegram-files/issues)**: Submit bugs found or log feature requests
  for the `telegram-files` project.
- **💡 [Submit Pull Requests](https://github.com/jarvis2f/telegram-files/blob/main/CONTRIBUTING.md)**: Review open PRs,
  and submit your own PRs.

<details closed>
<summary>Contributing Guidelines</summary>

1. **Fork the Repository**: Start by forking the project repository to your github account.
2. **Clone Locally**: Clone the forked repository to your local machine using a git client.
   ```sh
   git clone https://github.com/jarvis2f/telegram-files
   ```
3. **Create a New Branch**: Always work on a new branch, giving it a descriptive name.
   ```sh
   git checkout -b new-feature-x
   ```
4. **Make Your Changes**: Develop and test your changes locally.
5. **Commit Your Changes**: Commit with a clear message describing your updates.
   ```sh
   git commit -m 'Implemented new feature x.'
   ```
6. **Push to github**: Push the changes to your forked repository.
   ```sh
   git push origin new-feature-x
   ```
7. **Submit a Pull Request**: Create a PR against the original project repository. Clearly describe the changes and
   their motivations.
8. **Review**: Once your PR is reviewed and approved, it will be merged into the main branch. Congratulations on your
   contribution!

</details>

---

## 🎗 License

This project is protected under the MIT License. For more details,
refer to the [LICENSE](LICENSE) file.

---
