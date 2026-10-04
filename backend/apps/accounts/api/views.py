from typing import cast

from django.conf import settings
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core import ratelimit
from apps.core.exceptions import ApiError, TooManyRequests
from apps.core.net import client_ip
from apps.core.serializers import ErrorSerializer, OkSerializer

from .. import services
from ..authentication import current_session
from ..cookies import clear_auth_cookies, set_access_cookie, set_auth_cookies
from ..csrf import enforce_origin, reject_foreign_origin
from ..models import User
from ..selectors import me_payload
from ..tokens import issue_access
from .serializers import (
    ForgotSerializer,
    LoginSerializer,
    MeSerializer,
    NickAvailableSerializer,
    NickQuerySerializer,
    RegisterSerializer,
    ResetSerializer,
    VerifySerializer,
)

ERR = OpenApiResponse(ErrorSerializer, description="Ошибка {code, message, fields}")
OK = {"ok": True}


def _user(request: Request) -> User:
    """Пользователь на эндпоинтах с IsAuthenticated."""
    return cast(User, request.user)


def _rate_limit(request: Request, scope: str, limit: int, seconds: int) -> None:
    from datetime import timedelta

    if ratelimit.hit(scope, client_ip(request), timedelta(seconds=seconds)) > limit:
        raise TooManyRequests(extra={"retry_after": seconds})


class RegisterView(APIView):
    """Регистрация (экран 16). Сразу входит: дальше фронт ведёт на ввод кода из письма."""

    authentication_classes: list = []

    @extend_schema(tags=["auth"], request=RegisterSerializer, responses={201: OkSerializer, 400: ERR, 429: ERR})
    def post(self, request: Request) -> Response:
        reject_foreign_origin(request)
        _rate_limit(request, "register", limit=10, seconds=3600)
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        user = services.register_user(
            services.RegisterData(role=data["role"], nick=data["nick"], email=data["email"], password=data["password"]),
            request,
        )
        refresh = services.start_session(user, request, remember=True)
        response = Response(OK, status=status.HTTP_201_CREATED)
        set_auth_cookies(response, refresh)
        return response


class NickAvailableView(APIView):
    """Проверка ника на лету (экран 16), без учёта регистра."""

    authentication_classes: list = []

    @extend_schema(tags=["auth"], parameters=[NickQuerySerializer], responses={200: NickAvailableSerializer, 429: ERR})
    def get(self, request: Request) -> Response:
        _rate_limit(request, "nick", limit=60, seconds=60)
        query = NickQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        return Response({"available": services.nick_available(query.validated_data["nick"].strip())})


class LoginView(APIView):
    """Вход по почте или нику (экран 15). Ошибка всегда одна — invalid_credentials."""

    authentication_classes: list = []

    @extend_schema(tags=["auth"], request=LoginSerializer, responses={200: OkSerializer, 400: ERR, 403: ERR, 429: ERR})
    def post(self, request: Request) -> Response:
        reject_foreign_origin(request)
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        user = services.authenticate_login(data["login"], data["password"], request)
        refresh = services.start_session(user, request, remember=data["remember"])
        response = Response(OK)
        set_auth_cookies(response, refresh)
        return response


class RefreshView(APIView):
    """Обновление access по refresh-cookie; refresh ротируется. Без тела запроса."""

    authentication_classes: list = []

    @extend_schema(tags=["auth"], request=None, responses={200: OkSerializer, 401: ERR})
    def post(self, request: Request) -> Response:
        raw = request.COOKIES.get(settings.JWT_COOKIE["REFRESH_NAME"])
        if raw:
            enforce_origin(request)
        try:
            _user, refresh = services.rotate_refresh(raw)
        except ApiError as exc:
            response = Response({"code": exc.code, "message": str(exc.detail)}, status=exc.status_code)
            clear_auth_cookies(response)
            return response
        response = Response(OK)
        set_auth_cookies(response, refresh)
        return response


class LogoutView(APIView):
    authentication_classes: list = []

    @extend_schema(tags=["auth"], request=None, responses={200: OkSerializer})
    def post(self, request: Request) -> Response:
        raw = request.COOKIES.get(settings.JWT_COOKIE["REFRESH_NAME"])
        if raw:
            enforce_origin(request)
        services.logout(raw)
        response = Response(OK)
        clear_auth_cookies(response)
        return response


class VerifyView(APIView):
    """Подтверждение почты кодом (экран 18). Выдаёт новый access с email_verified=true."""

    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["auth"], request=VerifySerializer, responses={200: OkSerializer, 400: ERR, 401: ERR, 429: ERR})
    def post(self, request: Request) -> Response:
        serializer = VerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        services.verify_email(_user(request), serializer.validated_data["code"])
        response = Response(OK)
        session = current_session(request)
        if session:
            set_access_cookie(response, issue_access(_user(request), session))
        return response


class VerifyResendView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["auth"], request=None, responses={200: OkSerializer, 401: ERR, 429: ERR})
    def post(self, request: Request) -> Response:
        if not _user(request).email_verified:
            services.send_verification_code(_user(request))
        return Response(OK)


class ForgotView(APIView):
    """Всегда 200 — даже если почты нет (экран 17)."""

    authentication_classes: list = []

    @extend_schema(tags=["auth"], request=ForgotSerializer, responses={200: OkSerializer, 400: ERR})
    def post(self, request: Request) -> Response:
        serializer = ForgotSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        services.request_password_reset(serializer.validated_data["email"], request)
        return Response(OK)


class ResetView(APIView):
    """Новый пароль по ссылке из письма; все сессии завершаются. Устаревшая ссылка — 410."""

    authentication_classes: list = []

    @extend_schema(tags=["auth"], request=ResetSerializer, responses={200: OkSerializer, 400: ERR, 410: ERR})
    def post(self, request: Request) -> Response:
        serializer = ResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        services.reset_password(serializer.validated_data["token"], serializer.validated_data["password"])
        response = Response(OK)
        clear_auth_cookies(response)
        return response


class MeView(APIView):
    """Текущий пользователь: профиль, роли, разрешения, тариф организации, счётчики."""

    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["me"], responses={200: MeSerializer, 401: ERR})
    def get(self, request: Request) -> Response:
        return Response(MeSerializer(me_payload(_user(request))).data)
