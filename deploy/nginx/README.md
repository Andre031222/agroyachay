# nginx

`agroyachay.ginit.dev.conf` serves the web app and the API on one domain. `POST /api/sensores/lectura` stays reachable over plain HTTP because the node firmware has no CA bundle and does not follow redirects. The file uses `$connection_upgrade`, which must be defined once in the `http`
block (Debian: `/etc/nginx/conf.d/connection_upgrade.conf`):

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}
```

See [`../../docs/DEPLOYMENT.md`](../../docs/DEPLOYMENT.md) for installation and
certificate issuance.
