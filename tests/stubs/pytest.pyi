from typing import Any, Callable


class Marker():

    @classmethod
    def xfail(cls, condition: bool, reason: str) -> Callable: ...


mark = Marker()


def fixture(*args: Any, **kwargs: Any) -> Callable: ...

def fail(message: str) -> None: ...
