import json
import re
import sys
from typing import Any, Dict, List

import psycopg2
from psycopg2 import sql


def sanitize_identifier(name: str) -> str:
    name = str(name).strip().lower()
    name = name.replace(" ", "_")
    name = re.sub(r"[^a-zA-Z0-9_가-힣]", "_", name)
    name = re.sub(r"_+", "_", name).strip("_")
    if not name:
        name = "column"
    if name[0].isdigit():
        name = f"col_{name}"
    return name


def infer_pg_type(values: List[Any]) -> str:
    non_empty = [str(v).strip() for v in values if v is not None and str(v).strip() != ""]
    if not non_empty:
        return "TEXT"

    is_int = True
    is_float = True

    for value in non_empty:
        if not re.fullmatch(r"[-+]?\d+", value):
            is_int = False
        if not re.fullmatch(r"[-+]?\d+(\.\d+)?", value):
            is_float = False

    if is_int:
        return "BIGINT"
    if is_float:
        return "DOUBLE PRECISION"
    return "TEXT"


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "payload missing"}))
        sys.exit(1)

    payload = json.loads(sys.argv[1])

    table_name = sanitize_identifier(payload.get("table_name", "csv_table"))
    if_exists = payload.get("if_exists", "fail")
    db = payload.get("db", {})
    headers = payload.get("headers", [])
    rows = payload.get("rows", [])
    source_file = payload.get("source_file", "unknown.csv")

    if not headers:
        print(json.dumps({"success": False, "error": "headers missing"}))
        sys.exit(1)

    safe_headers = []
    used = set()
    for h in headers:
        name = sanitize_identifier(h)
        base = name
        idx = 1
        while name in used:
            name = f"{base}_{idx}"
            idx += 1
        used.add(name)
        safe_headers.append(name)

    columns_info = []
    for i, original_name in enumerate(headers):
        col_values = []
        for row in rows:
            col_values.append(row.get(original_name))
        pg_type = infer_pg_type(col_values)
        columns_info.append({
            "original_name": original_name,
            "name": safe_headers[i],
            "type": pg_type
        })

    conn = psycopg2.connect(
        host=db.get("host", "localhost"),
        port=db.get("port", 5433),
        dbname=db.get("database", "testdb"),
        user=db.get("user", "postgres"),
        password=db.get("password", "1234"),
    )
    cur = conn.cursor()

    try:
        cur.execute(
            """
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = %s
            )
            """,
            (table_name,)
        )
        exists = cur.fetchone()[0]

        if exists:
            if if_exists == "fail":
                raise Exception(f"table '{table_name}' already exists")
            elif if_exists == "replace":
                cur.execute(
                    sql.SQL("DROP TABLE IF EXISTS {}").format(
                        sql.Identifier(table_name)
                    )
                )
            elif if_exists == "append":
                pass
            else:
                raise Exception("if_exists must be fail, replace, or append")

        if (not exists) or if_exists == "replace":
            column_defs = []
            for col in columns_info:
                column_defs.append(
                    sql.SQL("{} {}").format(
                        sql.Identifier(col["name"]),
                        sql.SQL(col["type"])
                    )
                )

            create_query = sql.SQL("CREATE TABLE {} ({})").format(
                sql.Identifier(table_name),
                sql.SQL(", ").join(column_defs)
            )
            cur.execute(create_query)

        inserted_rows = 0

        if rows:
            insert_columns = [c["name"] for c in columns_info]

            insert_query = sql.SQL("INSERT INTO {} ({}) VALUES ({})").format(
                sql.Identifier(table_name),
                sql.SQL(", ").join(map(sql.Identifier, insert_columns)),
                sql.SQL(", ").join(sql.Placeholder() for _ in insert_columns)
            )

            normalized_rows = []
            for row in rows:
                values = []
                for original_name in headers:
                    val = row.get(original_name)
                    if val == "":
                        val = None
                    values.append(val)
                normalized_rows.append(tuple(values))

            cur.executemany(insert_query, normalized_rows)
            inserted_rows = len(normalized_rows)

        conn.commit()

        print(json.dumps({
            "success": True,
            "table_name": table_name,
            "inserted_rows": inserted_rows,
            "source_file": source_file,
            "columns": columns_info
        }, ensure_ascii=False))

    except Exception as e:
        conn.rollback()
        print(json.dumps({
            "success": False,
            "error": str(e)
        }, ensure_ascii=False))
        sys.exit(1)

    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    main()