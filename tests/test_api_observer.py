import time
from typing import Optional

import pytest
from faker import Faker

from helpers import Browser, DEFAULT_TIMEOUT


class Page:
    def __init__(self, browser: Browser) -> None:
        self.browser = browser
        self.browser.delete_cookies()
        self.browser.refresh()
        self.wait_until_ready()

    def wait_until_ready(self) -> None:
        self.wait_for_next_log("Initialize SDK")

    def start(self, email: str) -> None:
        email_input = self.browser.wait_for_element_presence(id="email")
        email_input.clear()
        email_input.send_keys(email)
        open_button = self.browser.get_element(xpath='//button[.="Start"]')
        open_button.click()
        self.wait_for_next_log("Instance is now READY")

    def stop(self) -> None:
        close_button = self.browser.get_element(xpath='//button[.="Stop"]')
        close_button.click()
        self.wait_for_next_log("Signed out")

    def encrypt(self, message: str, share_with: Optional[str] = None) -> str:
        clear_text_input = self.browser.get_element(id="clearText")
        clear_text_input.clear()
        clear_text_input.send_keys(message)
        if share_with:
            share_with_text_input = self.browser.get_element(id="shareWith")
            share_with_text_input.send_keys(share_with)
        encrypt_button = self.browser.get_element(xpath='//button[.="Encrypt"]')
        encrypt_button.click()
        self.wait_for_next_log("Encryption success")
        encrypted_text_input = self.browser.get_element(id="encryptedText")
        return encrypted_text_input.get_property("value")

    def decrypt(self, encrypted_text: str) -> str:
        encrypted_text_input = self.browser.get_element(id="encryptedText")
        encrypted_text_input.clear()
        encrypted_text_input.send_keys(encrypted_text)
        decrypt_button = self.browser.get_element(xpath='//button[.="Decrypt"]')
        decrypt_button.click()
        self.wait_for_next_log("Decryption success")
        clear_text_input = self.browser.get_element(id="clearText")
        return clear_text_input.get_property("value")

    def wait_for_next_log(self, pattern: str) -> None:
        print("Waiting for log containing", pattern, "...")
        waiting_time = 0
        while waiting_time < DEFAULT_TIMEOUT:
            current_log = self.get_latest_log_entry()
            if pattern not in current_log:
                time.sleep(1)
                waiting_time += 1
            else:
                return
        pytest.fail(f"Timed out waiting for log containing {pattern}")

    def get_latest_log_entry(self) -> str:
        latest_entry = self.browser.find_element(class_name="log-entry__title")
        assert latest_entry
        return latest_entry.text


def test_start_stop_start(browser: Browser) -> None:
    faker = Faker()
    email = faker.email()
    page = Page(browser)
    page.start(email)
    page.stop()
    latest_entry = page.get_latest_log_entry()
    assert f"Signed out {email}" in latest_entry
    page.start(email)


def test_encrypt_decrypt(browser: Browser) -> None:
    faker = Faker()
    email = faker.email()
    page = Page(browser)
    page.start(email)
    text = "my message"
    encrypted_text = page.encrypt(text)
    decrypted_text = page.decrypt(encrypted_text)
    assert decrypted_text == text


def test_share(browser: Browser) -> None:
    faker = Faker()
    alice_email = faker.email()
    bob_email = faker.email()

    page = Page(browser)
    page.start(alice_email)
    page.stop()
    page.start(bob_email)

    message = "I love you"
    encrypted_text = page.encrypt(message, share_with=alice_email)
    page.stop()

    page.start(alice_email)
    decrypted_text = page.decrypt(encrypted_text)
    assert decrypted_text == message
