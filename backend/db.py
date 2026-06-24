import os
import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2 import pool as pg_pool
from dotenv import load_dotenv

load_dotenv()

_DB_HOST = os.getenv('DB_HOST', 'localhost')
_DB_PORT = int(os.getenv('DB_PORT', 5432))
_DB_USER = os.getenv('DB_USER', 'postgres')
_DB_PASSWORD = os.getenv('DB_PASSWORD', '')
_DB_NAME = os.getenv('DB_NAME', 'as_terrasense')

_pool: pg_pool.ThreadedConnectionPool = None


def _get_pool() -> pg_pool.ThreadedConnectionPool:
    global _pool
    if _pool is None or _pool.closed:
        _pool = pg_pool.ThreadedConnectionPool(
            minconn=2,
            maxconn=15,
            host=_DB_HOST,
            port=_DB_PORT,
            user=_DB_USER,
            password=_DB_PASSWORD,
            dbname=_DB_NAME,
            cursor_factory=RealDictCursor,
        )
    return _pool


class _PooledConnection:
    def __init__(self, conn, pool):
        self._conn = conn
        self._pool = pool

    def __getattr__(self, name):
        return getattr(self._conn, name)

    def close(self):
        try:
            self._pool.putconn(self._conn)
        except Exception:
            pass

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
        return False


def get_db_connection() -> _PooledConnection:
    pool = _get_pool()
    conn = pool.getconn()
    return _PooledConnection(conn, pool)


get_db = get_db_connection
