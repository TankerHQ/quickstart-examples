import time
from typing import Optional

import pytest
from faker import Faker

from helpers import Browser


class Page:
    def __init__(self, browser: Browser) -> None:
        self.browser = browser

    def open(self, user_id: str) -> None:
        user_id_input = self.browser.wait_for_element_presence(id="userId")
        user_id_input.clear()
        user_id_input.send_keys(user_id)
        open_button = self.browser.get_element(xpath='//button[.="Open"]')
        open_button.click()
        self.wait_for_next_log("Opened")

    def close(self) -> None:
        close_button = self.browser.get_element(xpath='//button[.="Close"]')
        close_button.click()
        self.wait_for_next_log("Closed")

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
        while waiting_time < 10:
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


def test_open_close_reopen(browser: Browser) -> None:
    faker = Faker()
    user_id = faker.email()
    page = Page(browser)
    page.open(user_id)
    page.close()
    latest_entry = page.get_latest_log_entry()
    assert f"Closed session for {user_id}" in latest_entry
    page.open(user_id)
    latest_entry = page.get_latest_log_entry()
    assert f"Opened session for {user_id}" in latest_entry


def test_encrypt_decrypt(browser: Browser) -> None:
    faker = Faker()
    user_id = faker.email()
    page = Page(browser)
    page.open(user_id)
    text = "my message"
    encrypted_text = page.encrypt(text)
    decrypted_text = page.decrypt(encrypted_text)
    assert decrypted_text == text


def test_share(browser: Browser) -> None:
    faker = Faker()
    alice_id = faker.email()
    bob_id = faker.email()

    page = Page(browser)
    page.open(alice_id)
    page.close()
    page.open(bob_id)

    message = "I love you"
    encrypted_text = page.encrypt(message, share_with=alice_id)
    page.close()

    page.open(alice_id)
    decrypted_text = page.decrypt(encrypted_text)
    assert decrypted_text == message
