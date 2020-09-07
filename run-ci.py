import argparse
import json
import os
import time
import sys

from path import Path
import requests

import tankerci


def get_src_path():
    this_path = Path(__file__).abspath()
    return this_path.parent


def ensure_default_browser_not_started(app):
    """"
    When we call `yarn start:web:{app}`
    react-scripts will automatically open the default browser.

    In order to prevent this from happening,
    we create a file named `.env` in client/web/{app}
    containing BROWSER=NONE

    """
    src_path = get_src_path()
    dot_env_path = src_path / f"client/web/{app}/.env"
    dot_env_path.write_text("BROWSER=NONE\n")


def run_mypy():
    src_path = get_src_path()
    tests_path = src_path / "tests"
    env = os.environ.copy()
    env["MYPYPATH"] = tests_path / "stubs"
    # fmt: off
    tankerci.run(
        "poetry", "run",
        "mypy", "--strict", "--ignore-missing-imports", tests_path,
        check=True,
        env=env,
    )
    # fmt: on


def write_server_config():
    server_config = {}
    server_config["appId"] = os.environ["APP_ID"]
    server_config["appSecret"] = os.environ["APP_SECRET"]
    server_config["url"] = os.environ["TANKER_APPD_URL"]
    # Note: end-to-end tests do _not_ use the email
    # verification method, but the server will complain
    # if the auth token is missing:
    server_config["authToken"] = "dummy-token"
    config_path_out = Path("config/ci.json")
    config_path_out.write_text(json.dumps(server_config, indent=2))
    return config_path_out


def run_end_to_end_tests(app):
    ensure_default_browser_not_started(app)
    config_path = write_server_config()
    src_path = get_src_path()
    tests_path = src_path / "tests"
    with tankerci.run_in_background(
        "yarn", "start", "--config", config_path, cwd=src_path
    ):
        with tankerci.run_in_background("yarn", "start:web:%s" % app, cwd=src_path):
            # We let the server and the app time to fully start,
            # otherwise, browser might be stuck in a no man's land
            time.sleep(1)
            snake_case_name = app.replace("-", "_")
            pytest_file = f"test_{snake_case_name}.py"
            env = os.environ.copy()
            # On Ubuntu chromedriver is in /usr/lib/chromium-browser because reasons,
            # so add that to PATH.
            # This is required for Selenium to work.
            env["PATH"] = "/usr/lib/chromium-browser:" + env["PATH"]
            # fmt: off
            tankerci.run(
                "poetry", "run", "pytest",
                "--verbose",
                "--capture=no",
                "--headless",
                tests_path / pytest_file,
                check=True,
                env=env,
            )
            # fmt: on


def run_linters():
    src_path = get_src_path()
    tankerci.run("yarn")
    tankerci.run("yarn", "lint", cwd=src_path / "server")
    tankerci.run("yarn", "lint", cwd=src_path / "client/web/notepad")


def run_server_tests():
    src_path = get_src_path()
    tankerci.run("yarn", "test", check=True, cwd=src_path / "server")


def check_web():
    run_mypy()
    run_linters()
    run_server_tests()
    for web_app in ["api-observer"]:  # deactivated: "notepad"
        run_end_to_end_tests(web_app)


def compile_notepad_ios():
    src_path = get_src_path() / "client/ios/notepad/"
    tankerci.run("pod", "deintegrate", cwd=src_path)
    tankerci.run("pod", "install", "--repo-update", cwd=src_path)
    # fmt: off
    tankerci.run(
        "xcodebuild", "build",
        "-workspace", "notepad.xcworkspace",
        "-allowProvisioningUpdates",
        "-configuration", "Release",
        "-scheme", "notepad",
        cwd=src_path
    )
    # fmt: on


def compile_notepad_android(src_path):
    tankerci.run("./gradlew", "assembleRelease", cwd=src_path)


def get_browserstack_username():
    return os.environ["BROWSERSTACK_USERNAME"]


def get_browserstack_key():
    return os.environ["BROWSERSTACK_ACCESS_KEY"]


def query_browserstack(segment, method, **kwargs):
    url = "https://api-cloud.browserstack.com/app-automate"
    auth = (get_browserstack_username(), get_browserstack_key())
    r = getattr(requests, method)(f"{url}/{segment}", auth=auth, **kwargs)
    return r.json()


def send_app(apk_folder):
    app = f"{apk_folder}/localhost/app-localhost-unsigned.apk"
    files = {"file": open(app, "rb")}
    return query_browserstack("upload", "post", files=files)["app_url"]


def send_tests(apk_folder):
    tests = f"{apk_folder}/androidTest/localhost/app-localhost-androidTest.apk"
    files = {"file": open(tests, "rb")}
    return query_browserstack("espresso/test-suite", "post", files=files)["test_url"]


def start_build(config):
    return query_browserstack("espresso/build", "post", json=config)["build_id"]


def poll_build_status(build_id, devices):
    for _ in range(30):
        time.sleep(10)
        build = query_browserstack(f"espresso/builds/{build_id}", "get")
        if build["status"] == "done":
            for device in devices:
                test_result = build["devices"][device]["test_status"]
                if test_result["TIMEDOUT"] or test_result["FAILED"]:
                    raise Exception(f"There are failed test: {build}")
            return True
    return False


def run_android_tests(src_path):
    config_path = write_server_config()
    tankerci.run("./gradlew", "assembleLocalhost", cwd=src_path)
    tankerci.run("./gradlew", "assembleAndroidTest", cwd=src_path)
    apk_folder = src_path / "app/build/outputs/apk"
    app_url = send_app(apk_folder)
    test_url = send_tests(apk_folder)
    tankerci.run("yarn")
    devices = ["Google Pixel 3-9.0", "Samsung Galaxy S9-8.0", "Samsung Galaxy S6-5.0"]
    config = {
        "devices": devices,
        "app": app_url,
        "deviceLogs": "true",
        "testSuite": test_url,
        "local": "true",
    }
    with tankerci.run_in_background(
        "BrowserStackLocal", "--key", get_browserstack_key()
    ):
        # Wait for the tunnel to BrowserStack to be established
        time.sleep(5)
        with tankerci.run_in_background("yarn", "start", "--config", config_path):
            build_id = start_build(config)
            success = poll_build_status(build_id, devices)
    if not success:
        raise Exception("Timeout: BrowserStack tests are still running")


def check_ios():
    compile_notepad_ios()


def check_android():
    android_path = get_src_path() / "client/android/notepad"
    compile_notepad_android(android_path)
    run_android_tests(android_path)


def main():
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(dest="action", title="actions")

    subparsers.add_parser("android")
    subparsers.add_parser("ios")
    subparsers.add_parser("web")

    args = parser.parse_args()
    action = args.action

    if action == "android":
        check_android()
    elif action == "ios":
        check_ios()
    elif action == "web":
        check_web()
    else:
        parser.print_help()
        sys.exit()


if __name__ == "__main__":
    main()
