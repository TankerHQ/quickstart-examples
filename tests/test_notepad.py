import urllib.parse

from faker import Faker
import pytest
from typing import Any, Iterator, List, Optional
from typing_extensions import Protocol

import selenium.webdriver
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.support.ui import WebDriverWait


# Easier to maintain here rather than in a stub file
class SeleniumDriver(Protocol):
    def get(self, url: str) -> None: ...

    def quit(self) -> None: ...

    def refresh(self) -> None: ...

    def find_element_by_tag_name(self, name: str) -> 'SeleniumElement': ...

    def find_element_by_id(self, id: str) -> 'SeleniumElement': ...

    def get_attribute(self, name: str) -> str: ...


class SeleniumElement(Protocol):
    def click(self) -> None: ...

    def send_keys(self, text: str) -> None: ...

    @property
    def text(self) -> str: ...

    @property
    def tag_name(self) -> str: ...

    def find_element_by_tag_name(self, name: str) -> 'SeleniumElement': ...

    def find_element_by_id(self, id: str) -> 'SeleniumElement': ...

    def get_attribute(self, name: str) -> str: ...


class TextToChange():
    def __init__(self, browser: 'Browser', id: str) -> None:
        self.browser = browser
        self.element_id = id
        element = self.browser.get_element(id=id)
        self.old_text = element.text

    def __call__(self, driver: SeleniumDriver) -> bool:
        element = self.browser.get_element(id=self.element_id)
        current_text = element.text
        return current_text != self.old_text


class Browser:
    """ A nice facade on top of selenium stuff """

    def __init__(self, *, headless: bool = False) -> None:
        self.base_url = "http://127.0.0.1:3000"
        options = ChromeOptions()
        options.headless = headless
        # note: does not seem to work on tiling Window Managers
        options.add_argument("window-size=1200x600")
        self.driver = selenium.webdriver.Chrome(chrome_options=options)
        self.get("/")

    def find_element(self, **kwargs: str) -> Optional[SeleniumElement]:
        assert len(kwargs) == 1
        res = self.find_elements(**kwargs)
        if not res:
            return None
        return res[0]

    def get_element(self, **kwargs: str) -> SeleniumElement:
        assert len(kwargs) == 1
        res = self.find_elements(**kwargs)
        assert len(res) == 1
        return res[0]

    def find_elements(self, **kwargs: str) -> List[SeleniumElement]:
        assert len(kwargs) == 1
        name, value = list(kwargs.items())[0]
        name = name.rstrip("_")
        func_name = "find_elements_by_" + name
        func = getattr(self.driver, func_name)
        res: List[SeleniumElement] = func(value)
        return res

    def wait_for_element_presence(self, *, id: str, timeout: int = 10) -> SeleniumElement:
        driver_wait = WebDriverWait(self.driver, timeout)

        def element_is_present(driver: SeleniumDriver) -> bool:
            res = self.find_element(id=id)
            print(f"waiting for {id} to appear")
            return res is not None

        driver_wait.until(element_is_present)
        return self.get_element(id=id)

    def wait_for_any_element(self, *, ids: List[str], timeout: int = 10) -> None:
        driver_wait = WebDriverWait(self.driver, timeout)

        def elements_are_present(driver: SeleniumDriver) -> bool:
            print(f"waiting for {ids} to appear")
            found = [self.find_element(id=id) for id in ids]
            return any(found)

        driver_wait.until(elements_are_present)

    def wait_for_element_absence(self, *, id: str, timeout: int = 10) -> SeleniumElement:
        element = self.find_element(id=id)
        assert element
        driver_wait = WebDriverWait(self.driver, timeout)

        def element_is_absent(driver: SeleniumDriver) -> bool:
            res = self.find_element(id=id)
            print(f"waiting for {id} to disappear")
            return res is None

        res: SeleniumElement = driver_wait.until(element_is_absent)
        return res

    def wait_for_button_enabled(self, *, id: str) -> SeleniumElement:
        button_id = id
        element = self.find_element(id=button_id)
        assert element
        assert element.tag_name == "button"
        driver_wait = WebDriverWait(self.driver, timeout=10)

        def button_is_enabled(driver: SeleniumDriver) -> bool:
            element = driver.find_element_by_id(button_id)
            print(f"waiting for {id} to be enabled")
            return not element.get_attribute("disabled")

        driver_wait.until(button_is_enabled)
        return element

    def wait_for_text_change(self, *, id: str, timeout: int = 10) -> SeleniumElement:
        driver_wait = WebDriverWait(self.driver, timeout)
        res: SeleniumElement = driver_wait.until(TextToChange(self, id=id))
        return res

    def _to_full_url(self, segment: str) -> str:
        return urllib.parse.urljoin(self.base_url, segment)

    def get(self, segment: str) -> None:
        full_url = self._to_full_url(segment)
        self.driver.get(full_url)

    def refresh(self) -> None:
        self.driver.refresh()

    def close(self) -> None:
        self.driver.quit()


@pytest.fixture()
def browser(headless: bool) -> Iterator[Browser]:
    browser = Browser(headless=headless)
    yield browser
    browser.close()


class Client:
    def __init__(self, browser: Browser, email: str, password: str) -> None:
        self.browser = browser
        self.email = email
        self.password = password
        self.unlock_key: Optional[str] = None

    def sign_up(self) -> None:
        sign_up = self.browser.get_element(id="session_form_container-tab-sign-up")
        sign_up.click()
        username_input = self.browser.get_element(id="sign-up-user-id")
        username_input.send_keys(self.email)
        password_input = self.browser.get_element(id="sign-up-password")
        password_input.send_keys(self.password)
        signup_button = self.browser.get_element(id="sign-up-submit")
        signup_button.click()

        self.wait_for_unlock_key()
        done_button = self.browser.wait_for_button_enabled(id="key-done-button")
        key_well = self.browser.wait_for_element_presence(id="key-well")
        self.unlock_key = key_well.text
        done_button = self.browser.get_element(id="key-done-button")
        done_button.click()

    def sign_out(self) -> None:
        topbar_dropdown = self.browser.get_element(id="topbar_dropdown")
        topbar_dropdown.click()
        signout = self.browser.get_element(id="sign-out-menu-item")
        signout.click()

    def sign_in(self) -> None:
        sign_in = self.browser.get_element(id="session_form_container-tab-sign-in")
        sign_in.click()
        username_input = self.browser.get_element(id="sign-in-user-id")
        username_input.send_keys(self.email)
        password_input = self.browser.get_element(id="sign-in-password")
        password_input.send_keys(self.password)
        sign_in_button = self.browser.get_element(id="sign-in-submit")
        sign_in_button.click()

    def unlock_device(self, unlock_key: str) -> None:
        text_area = self.browser.get_element(id="unlock-key-textarea")
        text_area.send_keys(unlock_key)
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

    def wait_for_unlock_key(self) -> None:
        self.browser.wait_for_element_presence(id="save-unlock-key-heading")

    def wait_for_session_form(self) -> None:
        self.browser.wait_for_element_presence(id="session_form_container-tab-sign-in")

    def wait_for_home(self) -> None:
        self.browser.wait_for_element_presence(id="my-note-heading")
        self.browser.wait_for_any_element(ids=["accessible-notes-list", "accessible-notes-empty-span"])

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

    # Bob signs up
    bob_browser = Browser(headless=headless)
    request.addfinalizer(bob_browser.close)
    bob_client = Client(bob_browser, bob_email, bob_password)
    bob_client.sign_up()

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


@pytest.mark.xfail(True, reason="device addition is racy")
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
    unlock_key = first_client.unlock_key
    assert unlock_key
    first_client.create_note(fake_text)
    # Wait for the second device to exist ...
    first_browser.close()

    second_browser = Browser(headless=headless)
    request.addfinalizer(second_browser.close)
    second_client = Client(second_browser, email, password)
    second_client.wait_for_session_form()
    second_client.sign_in()
    second_client.wait_for_new_device()
    second_client.unlock_device(unlock_key)
    second_client.wait_for_home()
    second_client.go_to_edit()
    text_area = second_browser.get_element(id="edit-textarea")
    assert text_area.text == fake_text
    second_browser.close()
