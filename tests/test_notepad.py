from faker import Faker
import pytest
from typing import Any, Optional

from helpers import Browser


class Client:
    def __init__(self, browser: Browser, email: str, password: str) -> None:
        self.browser = browser
        self.email = email
        self.password = password
        self.unlock_key: Optional[str] = None

    def sign_up(self) -> None:
        sign_up = self.browser.get_element(id="session_form_container-tab-signup")
        sign_up.click()
        email_input = self.browser.get_element(id="sign-up-email")
        email_input.send_keys(self.email)
        password_input = self.browser.get_element(id="sign-up-password")
        password_input.send_keys(self.password)
        signup_button = self.browser.get_element(id="sign-up-submit")
        signup_button.click()

    def sign_out(self) -> None:
        topbar_dropdown = self.browser.get_element(id="topbar_dropdown")
        topbar_dropdown.click()
        logout = self.browser.get_element(id="log-out-menu-item")
        logout.click()

    def sign_in(self) -> None:
        sign_in = self.browser.get_element(id="session_form_container-tab-login")
        sign_in.click()
        email_input = self.browser.get_element(id="log-in-email")
        email_input.send_keys(self.email)
        password_input = self.browser.get_element(id="log-in-password")
        password_input.send_keys(self.password)
        sign_in_button = self.browser.get_element(id="log-in-submit")
        sign_in_button.click()

    def unlock_device(self, password: str) -> None:
        text_area = self.browser.get_element(id="password-input")
        text_area.send_keys(password)
        unlock_button = self.browser.get_element(id="unlock-button")
        unlock_button.click()

    def go_to_edit(self) -> None:
        edit_link = self.browser.get_element(id="edit-link")
        edit_link.click()
        self.browser.wait_for_element_presence(id="edit-textarea")
        self.browser.wait_for_button_enabled(id="save-button")

    def click_back(self) -> None:
        back_link = self.browser.get_element(id="back-link")
        back_link.click()

    def edit_note(self, text: str) -> None:
        text_area = self.browser.get_element(id="edit-textarea")
        text_area.send_keys(text)

    def create_note(self, text: str) -> None:
        self.go_to_edit()
        self.edit_note(text)
        self.save_note()

    def save_note(self) -> None:
        save_button = self.browser.get_element(id="save-button")
        save_button.click()
        self.browser.wait_for_text_change(id="save-button")

    def share_note_with(self, recipient: str) -> None:
        # Must be run from edit page
        goto_share_button = self.browser.get_element(id="go-to-share-button")
        goto_share_button.click()
        self.wait_for_share()

        share_button = self.browser.wait_for_button_enabled(id="share-button")
        alice_label = self.browser.get_element(xpath=f'//label[.="{recipient}"]')
        alice_input = alice_label.find_element_by_tag_name("input")
        alice_input.click()
        share_button.click()

        self.wait_for_edit()

    def view_note_from(self, friend: str) -> None:
        friend_button = self.browser.get_element(xpath=f'//button[.="From {friend}"]')
        friend_button.click()
        self.wait_for_friend_view()

    def wait_for_session_form(self) -> None:
        self.browser.wait_for_element_presence(id="session_form_container-tab-login")

    def wait_for_home(self) -> None:
        self.browser.wait_for_element_presence(id="my-note-heading")
        self.browser.wait_for_any_element(ids=["accessible-notes-list", "accessible-notes-empty-warning"])

    def wait_for_edit(self) -> None:
        self.browser.wait_for_element_presence(id="your-note-heading")

    def wait_for_friend_view(self) -> None:
        self.browser.wait_for_element_presence(id="note-from-friend-heading")
        self.browser.wait_for_element_absence(id="view-loading")

    def wait_for_share(self) -> None:
        self.browser.wait_for_element_presence(id="share-heading")

    def wait_for_new_device(self) -> None:
        self.browser.wait_for_element_presence(id="new-device-heading")

    def go_to_home(self) -> None:
        self.browser.get("/")


def test_sign_up_then_sign_out_then_sign_in(browser: Browser) -> None:
    fake = Faker()
    email = fake.email()
    password = fake.password()
    client = Client(browser, email, password)
    client.wait_for_session_form()
    client.sign_up()
    client.wait_for_home()
    client.sign_out()
    client.wait_for_session_form()
    client.sign_in()
    client.wait_for_home()


def test_sign_up_then_sign_in(browser: Browser) -> None:
    fake = Faker()
    email = fake.email()
    password = fake.password()
    client = Client(browser, email, password)
    client.wait_for_session_form()
    client.sign_up()
    client.wait_for_home()

    client.go_to_home()  # will actually re-direct to sign_in form
    client.sign_in()
    client.wait_for_home()


@pytest.fixture
def signed_in_client(browser: Browser) -> Client:
    fake = Faker()
    email = fake.email()
    password = fake.password()
    client = Client(browser, email, password)
    client.wait_for_session_form()
    client.sign_up()
    client.wait_for_home()
    return client


def test_create_note(browser: Browser, signed_in_client: Client) -> None:
    fake = Faker()
    bs_text = fake.bs()
    signed_in_client.create_note(bs_text)

    signed_in_client.click_back()
    signed_in_client.wait_for_home()
    signed_in_client.go_to_edit()
    text_area = browser.get_element(id="edit-textarea")
    assert text_area.text == bs_text


def test_share_note(headless: bool, request: Any) -> None:
    fake = Faker()
    alice_email = fake.email()
    alice_password = fake.password()
    bob_email = fake.email()
    bob_password = fake.password()

    # Alice signs up
    alice_browser = Browser(headless=headless)
    request.addfinalizer(alice_browser.close)
    alice_client = Client(alice_browser, alice_email, alice_password)
    alice_client.sign_up()
    alice_client.wait_for_home()

    # Bob signs up
    bob_browser = Browser(headless=headless)
    request.addfinalizer(bob_browser.close)
    bob_client = Client(bob_browser, bob_email, bob_password)
    bob_client.sign_up()
    bob_client.wait_for_home()

    # Bobs shares with Alice
    bs_text = fake.bs()
    bob_client.create_note(bs_text)
    bob_client.share_note_with(alice_email)

    # Alice refreshes
    refresh_button = alice_browser.get_element(id="refresh-button")
    refresh_button.click()
    alice_client.wait_for_home()

    # Alice views Bob's note
    alice_client.view_note_from(bob_email)
    text_area = alice_browser.get_element(id="view-textarea")
    from_bob_text = text_area.text
    assert from_bob_text == bs_text


@pytest.mark.xfail(True, reason="Needs access to Tanker's internals in order to be reliable")
def test_add_device(headless: bool, request: Any) -> None:
    fake = Faker()
    email = fake.email()
    password = fake.password()
    fake_text = fake.text()

    first_browser = Browser(headless=headless)
    request.addfinalizer(first_browser.close)
    first_client = Client(first_browser, email, password)
    first_client.wait_for_session_form()
    first_client.sign_up()
    first_client.wait_for_home()
    first_client.create_note(fake_text)
    first_client.sign_out()
    first_browser.close()

    second_browser = Browser(headless=headless)
    request.addfinalizer(second_browser.close)
    second_client = Client(second_browser, email, password)
    second_client.wait_for_session_form()
    second_client.sign_in()
    second_client.wait_for_new_device()
    second_client.unlock_device(password)
    second_client.wait_for_home()
    second_client.go_to_edit()
    text_area = second_browser.get_element(id="edit-textarea")
    assert text_area.text == fake_text
    second_browser.close()
