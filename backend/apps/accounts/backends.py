from django.contrib.auth.backends import ModelBackend

from .models import User


class EmailOrNickBackend(ModelBackend):
    """Вход по почте или нику (раздел 5). Используется и админкой Django."""

    def authenticate(self, request, username=None, password=None, **kwargs):
        login = username or kwargs.get("email") or kwargs.get("login")
        if not login or password is None:
            return None
        user = User.objects.get_by_login(login)
        if user is None:
            User().set_password(password)  # выравниваем время ответа — защита от перебора адресов
            return None
        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None
