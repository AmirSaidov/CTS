from drf_spectacular.extensions import OpenApiAuthenticationExtension


class CookieJWTScheme(OpenApiAuthenticationExtension):
    """Описание входа для OpenAPI: access-JWT в httpOnly-cookie или заголовке Authorization."""

    target_class = "apps.accounts.authentication.CookieJWTAuthentication"
    name = ["cookieAuth", "bearerAuth"]

    def get_security_definition(self, auto_schema):
        return [
            {
                "type": "apiKey",
                "in": "cookie",
                "name": "access",
                "description": "httpOnly-cookie, выставляется /auth/login/",
            },
            {"type": "http", "scheme": "bearer", "bearerFormat": "JWT"},
        ]
