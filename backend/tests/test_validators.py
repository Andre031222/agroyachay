from app.utils.validators import (
    validar_dni,
    validar_email,
    validar_telefono,
    validar_fecha,
)


class TestValidarDni:
    def test_valido(self):
        assert validar_dni('12345678') is True

    def test_corto(self):
        assert validar_dni('1234567') is False

    def test_con_letras(self):
        assert validar_dni('1234567a') is False


class TestValidarEmail:
    def test_valido(self):
        assert validar_email('usuario@dominio.com') is True

    def test_sin_arroba(self):
        assert validar_email('usuario.dominio.com') is False

    def test_sin_dominio(self):
        assert validar_email('usuario@') is False


class TestValidarTelefono:
    def test_valido(self):
        assert validar_telefono('987654321') is True

    def test_corto(self):
        assert validar_telefono('98765') is False


class TestValidarFecha:
    def test_valida(self):
        assert validar_fecha('2026-06-22') is not None

    def test_invalida(self):
        assert validar_fecha('22/06/2026') is None

    def test_basura(self):
        assert validar_fecha('no-es-fecha') is None
