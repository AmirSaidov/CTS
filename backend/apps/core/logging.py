import json
import logging
from datetime import datetime, timezone

from .context import request_id_var, user_id_var

# поля, которые нельзя писать в логи (раздел 11)
_SECRET_KEYS = ("password", "token", "code", "secret", "authorization", "cookie")


class RequestContextFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = request_id_var.get()
        record.user_id = user_id_var.get()
        return True


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "ts": datetime.fromtimestamp(record.created, timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "request_id": getattr(record, "request_id", "-"),
            "user_id": getattr(record, "user_id", "-"),
        }
        extra = getattr(record, "data", None)
        if isinstance(extra, dict):
            payload["data"] = {k: ("***" if any(s in k.lower() for s in _SECRET_KEYS) else v) for k, v in extra.items()}
        if record.exc_info:
            payload["exc"] = self.formatException(record.exc_info)
        return json.dumps(payload, ensure_ascii=False, default=str)
