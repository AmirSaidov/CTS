from django.urls import path

from . import views

auth_urlpatterns = [
    path("register/", views.RegisterView.as_view(), name="auth-register"),
    path("nick-available/", views.NickAvailableView.as_view(), name="auth-nick-available"),
    path("login/", views.LoginView.as_view(), name="auth-login"),
    path("logout/", views.LogoutView.as_view(), name="auth-logout"),
    path("refresh/", views.RefreshView.as_view(), name="auth-refresh"),
    path("verify/", views.VerifyView.as_view(), name="auth-verify"),
    path("verify/resend/", views.VerifyResendView.as_view(), name="auth-verify-resend"),
    path("password/forgot/", views.ForgotView.as_view(), name="auth-password-forgot"),
    path("password/reset/", views.ResetView.as_view(), name="auth-password-reset"),
    # фронт запрашивает текущего пользователя по /auth/me/ (src/shared/api/endpoints.ts)
    path("me/", views.MeView.as_view(), name="auth-me"),
]

me_urlpatterns = [
    path("", views.MeView.as_view(), name="me"),
]
