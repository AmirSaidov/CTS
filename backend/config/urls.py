from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import URLPattern, URLResolver, include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from apps.accounts.api.urls import auth_urlpatterns, me_urlpatterns
from apps.billing.api.views import PlanListView
from apps.core.views import healthz, readyz
from apps.games.api.views import GameListView

api_v1: list[URLPattern | URLResolver] = [
    path("auth/", include(auth_urlpatterns)),
    path("me/", include(me_urlpatterns)),
    path("games/", GameListView.as_view(), name="games"),
    path("plans/", PlanListView.as_view(), name="plans"),
]

if settings.API_DOCS_ENABLED:
    api_v1 += [
        path("schema/", SpectacularAPIView.as_view(), name="schema"),
        path("docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="docs"),
    ]

urlpatterns = [
    path("api/v1/", include(api_v1)),
    path("admin/", admin.site.urls),
    path("healthz", healthz),
    path("readyz", readyz),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
