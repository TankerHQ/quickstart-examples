# QuickStart end-to-end tests

This directory contains end-to-end tests for the Notepad and API Observer web applications.

## Setup

First, install the `chromedriver` binary and make sure it is in you `PATH`.

Then use `dmenv` to install `pytest`, `selenium` and other Python dependencies:

```
dmenv install
```

## Running tests

Start the notepad server as usual:

```
cd ..
yarn start:server
```

Then run `pytest`, like this:

```
dmenv run -- pytest test_notepad.py
```

## Modifying test code

You should use `mypy` to check any change in test code:

```
dmenv run  -- mypy --strict --ignore-missing-imports
```

## Debugging

Feel free to add breakpoint statements in the Python source code, and interact with the browser *while the tests are running*.
