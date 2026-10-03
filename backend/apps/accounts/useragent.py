"""Грубый разбор User-Agent для списка сессий: «Chrome · Windows»."""

import re

_BROWSERS = [
    ("Edge", r"Edg/"),
    ("Opera", r"OPR/|Opera"),
    ("Yandex", r"YaBrowser/"),
    ("Chrome", r"Chrome/"),
    ("Firefox", r"Firefox/"),
    ("Safari", r"Safari/"),
]
_OSES = [
    ("iOS", r"iPhone|iPad|iPod"),
    ("Android", r"Android"),
    ("Windows", r"Windows"),
    ("macOS", r"Mac OS X|Macintosh"),
    ("Linux", r"Linux"),
]


def parse(ua: str) -> dict[str, str]:
    browser = next((name for name, rx in _BROWSERS if re.search(rx, ua)), "")
    os_name = next((name for name, rx in _OSES if re.search(rx, ua)), "")
    if re.search(r"iPhone|Android.*Mobile", ua):
        device = "mobile"
    elif re.search(r"iPad|Android", ua):
        device = "tablet"
    else:
        device = "desktop" if ua else ""
    return {"browser": browser, "os": os_name, "device": device}
