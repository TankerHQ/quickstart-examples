import pytest
from typing import Any


def pytest_addoption(parser: Any) -> None:
    parser.addoption("--headless", action="store_true")


@pytest.fixture
def headless(request: Any) -> bool:
    option: bool = request.config.getoption("--headless")
    return option
