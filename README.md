[last-commit-badge]: https://img.shields.io/github/last-commit/TankerHQ/quickstart-examples.svg?label=Last%20commit&logo=github
[license-badge]: https://img.shields.io/badge/License-Apache%202.0-blue.svg
[license-link]: https://opensource.org/licenses/Apache-2.0
[platform-badge]: https://img.shields.io/static/v1.svg?label=Platform&message=android%20%7C%20ios%20%7C%20javascript&color=lightgrey

<img src="https://cdn.jsdelivr.net/gh/TankerHQ/sdk-js@v1.10.1/src/public/tanker.png" alt="Tanker logo" width="180" />

[![License][license-badge]][license-link]
![Platform][platform-badge]
![Last Commit][last-commit-badge]

# Integration examples of encryption SDKs

[Overview](#overview) · [Prerequisites](#prerequisites) · [Start the server](#start-the-example-server) · [Run examples](#run-example-applications) · [Documentation](#documentation) · [License](#license)

## Overview

Tanker is an open-source client SDK that can be embedded in any application.

It leverages powerful **client-side encryption** of any type of data, textual or binary, but without performance loss and assuring a **seamless end-user experience**. No cryptographic skills are required.

This repository features example applications using the **[JavaScript](https://github.com/TankerHQ/sdk-js)**, **[iOS](https://github.com/TankerHQ/sdk-ios)**, and **[Android](https://github.com/TankerHQ/sdk-android)** encryption SDKs.

## Prerequisites

### Setup

<details>
<summary><b>Developing on Windows?</b> Click here to display additional instructions.</summary>

#### ↡↡↡↡↡↡↡↡↡↡ Windows instructions ↡↡↡↡↡↡↡↡↡↡

<br />

On Windows 10 version 1607 or later, the easiest way to run the quickstart examples is by installing the [Windows Subsystem for Linux](https://docs.microsoft.com/en-us/windows/wsl/about).

Although it is possible to set up a Node.js stack on older Windows versions, the amount of work required is out of the scope of this guide.

Once you have enabled [Windows Subsystem for Linux](https://docs.microsoft.com/en-us/windows/wsl/about), open a new Command Prompt instance and type the following:

```bash
bash
```

Your Command Prompt instance should now be a Bash instance.

For the record, you can access your Windows `C:\` drive at anytime under `/mnt/c`.

Let's update the repo lists and packages:

```bash
sudo apt update -y && sudo apt upgrade -y
```

Install Node.js:

```
sudo apt install nodejs
```

Install Yarn by [following the Ubuntu instructions](https://yarnpkg.com/en/docs/install#debian-stable) on yarnpkg.com.

#### ↟↟↟↟↟↟↟↟↟↟ Windows instructions ↟↟↟↟↟↟↟↟↟↟

</details>

<br />

Check your [Node.js](https://nodejs.org/en/) and [Yarn](https://yarnpkg.com/en/docs/install) versions, and upgrade if needed:
```bash
node -v  # >= 10   (maintained version, not eol)
yarn -v  # >= 1.0  (workspaces support)
```

We recommend using `yarn` rather than `npm`, as it will manage the dependencies of all the applications for you from the root of the repository.

### Install the project

Clone this repository:
```bash
git clone https://github.com/TankerHQ/quickstart-examples.git
```

Install all dependencies at once:
```bash
cd quickstart-examples && yarn
```

### Create a Tanker App

To create a Tanker App, create a free account on the [dashboard](https://dashboard.tanker.io/signup) and follow the instructions. Since you are just testing Tanker and not building a real private application, feel free to enable the test mode.

Once you start building real private applications, you can just create other Tanker Apps.

### Configure

Take the JSON configuration file from the previous step and copy it under the `config/` folder. Add an `authToken` key containing the value of the
authorization token in the "API credentials" section of the dashboard.

Note that the JSON configuration file can have any name ending with the `.json` extension and must have the following format:

```javascript
// e.g. config/app.json
{
    "appId": "...",
    "appSecret": "...",
    "authToken": "..."
}
```

That's all you need to start the server and applications!

## Start the example server

Start the example server in a terminal with:

```bash
yarn start:server
```

The example server provides applications with:
* a mock auth system
* an endpoint to retrieve user tokens as needed by the Tanker SDK
* a couple of routes to upload/download user data

You may also provide the path of a config file explicitely:

```bash
yarn start:server --config <path>
```

## Run example applications

Note: before running any of the example applications, don't forget to always start the server first!

Go to the homepage of the example server in your browser:

```
http://127.0.0.1:8080/
```

On this page, you will find all the instructions needed to run the example applications.

## Documentation

For more details and to go beyond the example applications, please refer to:

* [SDK implementation guide](https://docs.tanker.io/core/latest/)
* [API reference](https://docs.tanker.io/core/latest/api/tanker/)
* [Product overview](https://tanker.io/)

## License

The Tanker iOS SDK is licensed under the [Apache License, version 2.0](http://www.apache.org/licenses/LICENSE-2.0).
