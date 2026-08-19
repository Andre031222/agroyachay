"""Tests for the pest-diagnosis vision path with the model call mocked.

The vision model (Ollama) is replaced by a fake response, so these run with no
GPU, no network and no physical hardware -- letting reviewers verify the parsing
and error handling of the diagnosis pipeline in isolation.
"""
import io
import json

import app.services.groq_service as gs


class _FakeResp(io.BytesIO):
    def __enter__(self):
        return self

    def __exit__(self, *a):
        self.close()


def _fake_ollama(payload):
    """Return a canned Ollama /api/generate response wrapping a diagnosis JSON."""
    body = {
        "response": json.dumps({
            "is_healthy": False,
            "nombre": "Tizon tardio",
            "confianza": 78,
            "severidad": "moderada",
            "descripcion": "Manchas de tizon en la hoja.",
            "causas": "Phytophthora infestans.",
            "tratamiento": "Fungicida cuprico.",
            "prevencion": "Rotacion de cultivos.",
        })
    }
    return _FakeResp(json.dumps(body).encode("utf-8"))


def test_vision_diagnosis_parses_structured_json(monkeypatch, tmp_path):
    monkeypatch.setattr(gs, "VISION_ENGINE", "ollama")
    monkeypatch.setattr(gs.urllib.request, "urlopen",
                        lambda req, timeout=0: _fake_ollama(req))
    img = tmp_path / "leaf.jpg"
    img.write_bytes(b"\xff\xd8\xff\xe0fake-jpeg-bytes")

    out = gs.detectar_plaga_vision(str(img), cultivo="papa")

    assert out["success"] is True
    r = out["resultado"]
    assert r["is_healthy"] is False
    assert r["confianza"] == 78
    assert r["severidad"] == "moderada"
    assert "nombre" in r


def test_vision_diagnosis_handles_json_wrapped_in_text(monkeypatch, tmp_path):
    # Some models wrap the JSON in prose or code fences; the parser must recover it.
    def wrapped(payload):
        body = {"response": "Here is the result:\n```json\n"
                            "{\"is_healthy\": true, \"nombre\": \"Planta Saludable\"}\n```"}
        return _FakeResp(json.dumps(body).encode("utf-8"))

    monkeypatch.setattr(gs, "VISION_ENGINE", "ollama")
    monkeypatch.setattr(gs.urllib.request, "urlopen",
                        lambda req, timeout=0: wrapped(req))
    img = tmp_path / "leaf.jpg"
    img.write_bytes(b"fake")

    out = gs.detectar_plaga_vision(str(img), cultivo="papa")
    assert out["success"] is True
    assert out["resultado"]["is_healthy"] is True


def test_vision_diagnosis_reports_error_on_backend_failure(monkeypatch, tmp_path):
    def boom(req, timeout=0):
        raise RuntimeError("model unavailable")

    monkeypatch.setattr(gs, "VISION_ENGINE", "ollama")
    monkeypatch.setattr(gs.urllib.request, "urlopen", boom)
    img = tmp_path / "leaf.jpg"
    img.write_bytes(b"fake")

    out = gs.detectar_plaga_vision(str(img), cultivo="papa")
    assert out["success"] is False
    assert "error" in out
