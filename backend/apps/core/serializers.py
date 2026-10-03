from rest_framework import serializers


class ErrorSerializer(serializers.Serializer):
    """Формат любой ошибки API — для OpenAPI-схемы."""

    code = serializers.CharField(help_text="Стабильный код для фронта, например plan_limit_reached")
    message = serializers.CharField(help_text="Переведённый текст ошибки")
    # метакласс DRF убирает объявленные поля из атрибутов класса, так что имя fields безопасно
    fields = serializers.DictField(  # type: ignore[assignment]
        child=serializers.ListField(child=serializers.CharField()), required=False
    )


class OkSerializer(serializers.Serializer):
    ok = serializers.BooleanField(default=True)
