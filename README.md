# Tanker examples

Example applications using the Tanker SDK in JavaScript, iOS and Android.

## Prerequisites

### Setup on Linux and MacOS

Install [Node.js](https://nodejs.org/en/) and [Yarn](https://yarnpkg.com/en/docs/install), or upgrade if needed:
```bash
node -v  # >= 8    (async/await support)
yarn -v  # >= 1.0  (workspaces support)
```

We recommend using `yarn` rather than `npm`, as it will manage the dependencies of all the applications for you from the root of the repository.

### Setup on Windows

On Windows 10 version 1607 or later, the easiest way to run the quickstart examples is by installing the [Windows Subsystem for Linux](https://msdn.microsoft.com/en-us/commandline/wsl/about).

Although it is possible to set up a Node.js stack on older Windows versions, the amount of work required is out of the scope of this guide.

Once you have enabled [Windows Subsystem for Linux](https://msdn.microsoft.com/en-us/commandline/wsl/about), open a new Command Prompt instance and type the following:

```bash
bash
```

Your Command Prompt instance should now be a Bash instance. Let's update the repo lists and packages:

```bash
sudo apt update -y && sudo apt upgrade -y
```

Install Node.js:

```
sudo apt install nodejs
```

Install Yarn by [following the Ubuntu instructions](https://yarnpkg.com/en/docs/install#debian-stable) on yarnpkg.com.

We recommend using `yarn` rather than `npm`, as it will manage the dependencies of all the applications for you from the root of the repository.

Finally, verify that your setup is up to date:
```bash
node -v  # >= 8    (async/await support)
yarn -v  # >= 1.0  (workspaces support)
```

For the record, you can access your Windows C:\ drive at anytime under `/mnt/c`.

### Install the project

Clone this repository:
```bash
git clone https://github.com/TankerHQ/quickstart-examples.git
```

Install all dependencies at once:
```bash
cd quickstart-examples && yarn
```

### Create a Trustchain

In short, your Trustchain is the structure on which the cryptographic operations will be stored when you run the examples. It only contains data that is either public or encrypted, and is hosted by Tanker.

To create a Trustchain, create a free account on the [Tanker dashboard](https://dashboard.tanker.io/signup) and follow the instructions. Make sure you store the configuration file safely, as you'll need it later.

Once you start building real private apps, you can just create other Trustchains.

### Configure

Take the JSON configuration file from the previous step and copy it under the `config/` folder.

Note that the JSON configuration file can have any name ending with the `.json` extension and must have the following format:

```javascript
// e.g. config/my-trustchain.json
{
    "trustchainId": "...",
    "trustchainPrivateKey": "..."
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

On this page, you will find all the instructions needed to run the example applications and a link to a tutorial.
