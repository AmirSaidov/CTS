from rest_framework import generics

from ..selectors import public_games
from .serializers import GameSerializer


class GameListView(generics.ListAPIView):
    """Справочник игр (экраны 05, 19). Без пагинации — список короткий."""

    serializer_class = GameSerializer
    pagination_class = None
    filter_backends: list = []
    authentication_classes: list = []

    def get_queryset(self):
        return public_games()
