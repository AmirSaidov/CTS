from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from ..models import Game


class RosterSerializer(serializers.Serializer):
    main = serializers.IntegerField()
    subs = serializers.IntegerField()


class GameSerializer(serializers.ModelSerializer):
    roster = serializers.SerializerMethodField()
    account_check = serializers.CharField(source="account_provider")
    formats = serializers.SerializerMethodField()

    class Meta:
        model = Game
        fields = [
            "slug",
            "name",
            "short",
            "publisher",
            "team_size",
            "roster",
            "account_check",
            "formats",
            "status",
            "maps",
            "art",
        ]

    @extend_schema_field(RosterSerializer)
    def get_roster(self, game: Game) -> dict[str, int]:
        return {"main": game.team_size, "subs": game.max_subs}

    @extend_schema_field(serializers.ListField(child=serializers.CharField()))
    def get_formats(self, game: Game) -> list[str]:
        # форматы предзагружены prefetch_related (только включённые)
        return [f.code for f in game.formats.all()]
