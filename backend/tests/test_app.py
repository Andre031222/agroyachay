def test_health(client):
    resp = client.get('/health')
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['status'] == 'healthy'


def test_home(client):
    resp = client.get('/')
    data = resp.get_json()
    assert resp.status_code == 200
    assert data['status'] == 'running'
    assert 'endpoints' in data


def test_ruta_inexistente(client):
    resp = client.get('/ruta-que-no-existe')
    assert resp.status_code == 404


def test_login_sin_token_protegido(client):
    resp = client.get('/api/auth/profile')
    assert resp.status_code in (401, 422)
