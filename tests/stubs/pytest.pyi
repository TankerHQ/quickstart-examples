from typing import Any, Callable


class Marker():

    @classmethod
    def xfail(cls, condition: bool, reason: str) -> Callable[..., None]: ...


mark = Marker()


def fixture(*args: Any, **kwargs: Any) -> Callable[..., Any]: ...

def fail(message: str) -> None: ...
