#!/usr/bin/env python3
"""
Run `./server.py -h` for help
"""
from http.server import HTTPServer, HTTPStatus, SimpleHTTPRequestHandler
from jsonrpc import JSONRPCResponseManager, dispatcher
import json
import sqlite3


class MyHTTPRequestHandler(SimpleHTTPRequestHandler):
    """ Обёртка над простым HTTP-сервером.

        Позволяет запускать SQL-команды, используя POST-запросы и JSON-RPC.
    """

    def do_POST(self):
        # POST только для интерпретатора
        if self.path.endswith("sql-interpreter"):
            self.run_sql()
        else:
            self.send_error(HTTPStatus.NOT_IMPLEMENTED, "Can only POST to SQL")

    def run_sql(self):
        # читаю данные запроса
        length = int(self.headers.get("content-length"))
        data = self.rfile.read(length)
        # интерпретирую их и передаю функции `execute`
        response = JSONRPCResponseManager.handle(data, dispatcher)
        # выставляю заголовки
        self.send_response(HTTPStatus.OK, "JSON output follows")
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        # отправляю ответ
        self.wfile.write(json.dumps(response.data).encode("utf-8"))


database_uri = ""


def set_database_path(path):
    # URI позволяет открыть базу в режиме только для чтения
    global database_uri
    database_uri = "file:" + path + "?mode=ro"


def execute(s, *params):
    """ Исполняет SQL-запрос на выбранной SQLite-базе. """
    # открывает её, исполняет, и сразу же закрывает
    conn = sqlite3.connect(database_uri, uri=True)
    c = conn.cursor()
    c.execute(s, params)
    # ответ переводим в формат JSON
    res = json.dumps(c.fetchall())
    conn.close()
    return res


def run(
    server_class=HTTPServer,
    handler_class=MyHTTPRequestHandler,
    addr="localhost",
    port=8100,
):
    server_address = (addr, port)
    httpd = server_class(server_address, handler_class)

    # jsonrpc.dispatcher - словарь вида {имя_метода: функция}
    dispatcher["execute"] = execute

    print(f"HTTP-SQLite сервер запущен на {addr}:{port}")
    httpd.serve_forever()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Запускает HTTP-сервер просмотра базы SQLite"
    )
    parser.add_argument(
        "-b",
        dest="database",
        default="db.sqlite",
        help="Путь к файлу с базой SQLite (обязателен)",
        required=True,
    )
    parser.add_argument(
        "-a", dest="address", default="localhost", help="IP-адрес сервера",
    )
    parser.add_argument(
        "-p", dest="port", type=int, default=8100, help="Порт сервера",
    )
    args = parser.parse_args()
    set_database_path(args.database)
    run(addr=args.address, port=args.port)
