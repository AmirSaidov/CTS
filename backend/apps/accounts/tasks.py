from datetime import timedelta

from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone


@shared_task(autoretry_for=(Exception,), retry_backoff=True, max_retries=5)
def send_email(to: str, subject: str, body: str) -> None:
    send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [to])


@shared_task
def cleanup_expired_codes() -> None:
    """Раз в сутки: просроченные коды и refresh-токены (раздел 8, плановые задачи)."""
    from rest_framework_simplejwt.token_blacklist.models import OutstandingToken

    from .models import VerificationCode

    now = timezone.now()
    VerificationCode.objects.filter(expires_at__lt=now - timedelta(days=1)).delete()
    OutstandingToken.objects.filter(expires_at__lt=now).delete()
