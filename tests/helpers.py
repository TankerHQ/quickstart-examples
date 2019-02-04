import urllib.parse
from typing import List, Optional
from typing_extensions import Protocol

import selenium.webdriver
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.support.ui import WebDriverWait


DEFAULT_TIMEOUT = 30


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

    def clear(self) -> None: ...

    @property
    def text(self) -> str: ...

    @property
    def tag_name(self) -> str: ...

    def find_element_by_tag_name(self, name: str) -> 'SeleniumElement': ...

    def find_element_by_id(self, id: str) -> 'SeleniumElement': ...

    def get_attribute(self, name: str) -> str: ...

    def get_property(self, name: str) -> str: ...


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
        if headless:
            options.add_argument("--no-sandbox")
            options.add_argument("--disable-extensions")
            options.add_argument("--disable-translate")
        # note: does not seem to work on tiling Window Managers
        options.add_argument("window-size=1200x600")
        self.driver = selenium.webdriver.Chrome(options=options)
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

    def wait_for_element_presence(self, *, id: str, timeout: int = DEFAULT_TIMEOUT) -> SeleniumElement:
        driver_wait = WebDriverWait(self.driver, timeout)

        def element_is_present(driver: SeleniumDriver) -> bool:
            res = self.find_element(id=id)
            print(f"waiting for {id} to appear")
            return res is not None

        driver_wait.until(element_is_present)
        return self.get_element(id=id)

    def wait_for_any_element(self, *, ids: List[str], timeout: int = DEFAULT_TIMEOUT) -> None:
        driver_wait = WebDriverWait(self.driver, timeout)

        def elements_are_present(driver: SeleniumDriver) -> bool:
            print(f"waiting for {ids} to appear")
            found = [self.find_element(id=id) for id in ids]
            return any(found)

        driver_wait.until(elements_are_present)

    def wait_for_element_absence(self, *, id: str, timeout: int = DEFAULT_TIMEOUT) -> SeleniumElement:
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
        driver_wait = WebDriverWait(self.driver, timeout=DEFAULT_TIMEOUT)

        def button_is_enabled(driver: SeleniumDriver) -> bool:
            element = driver.find_element_by_id(button_id)
            print(f"waiting for {id} to be enabled")
            return not element.get_attribute("disabled")

        driver_wait.until(button_is_enabled)
        return element

    def wait_for_text_change(self, *, id: str, timeout: int = DEFAULT_TIMEOUT) -> SeleniumElement:
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

    def delete_cookies(self) -> None:
        self.driver.delete_all_cookies()

    def close(self) -> None:
        self.driver.quit()
