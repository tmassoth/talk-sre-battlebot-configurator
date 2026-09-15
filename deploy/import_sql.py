#!/usr/bin/env python3
"""Apply .sql dump files to an Azure SQL Database using pyodbc.

Replacement for the `sqlcmd` loop in setup.sh when the mssql-tools install
fails. Reads connection settings from the environment (same names setup.sh
already exports) and splits each file on `GO` batch separators, which pyodbc
does not understand natively.

Usage:
    python deploy/import_sql.py deploy/sql/*.sql
    # or, with no args, applies every deploy/sql/*.sql in sorted order:
    python deploy/import_sql.py
"""
import glob
import os
import re
import sys

import pyodbc


def connection_string() -> str:
    server = os.getenv("DB_SERVER")
    if not server:
        name = os.getenv("DB_SERVER_NAME")
        if not name:
            sys.exit("Set DB_SERVER (FQDN) or DB_SERVER_NAME.")
        server = f"{name}.database.windows.net"

    database = os.getenv("DB_NAME") or sys.exit("Set DB_NAME.")
    user = os.getenv("DB_USER")
    password = os.getenv("DB_PASSWORD")

    # Pick the newest installed "ODBC Driver NN for SQL Server".
    drivers = sorted(d for d in pyodbc.drivers() if "ODBC Driver" in d and "SQL Server" in d)
    if not drivers:
        sys.exit("No 'ODBC Driver NN for SQL Server' found. Install msodbcsql18.")
    driver = drivers[-1]

    parts = [
        f"DRIVER={{{driver}}}",
        f"SERVER={server}",
        f"DATABASE={database}",
        "Encrypt=yes",
        "TrustServerCertificate=no",
        "Connection Timeout=30",
    ]
    if user:
        parts += [f"UID={user}", f"PWD={password}"]
    else:
        # No user -> Azure AD / managed identity (az login, MSI, ...).
        parts.append("Authentication=ActiveDirectoryDefault")
    return ";".join(parts) + ";"


def batches(sql: str):
    # Split on lines containing only GO (case-insensitive), like sqlcmd/SSMS.
    for batch in re.split(r"(?im)^\s*GO\s*;?\s*$", sql):
        if batch.strip():
            yield batch


def main() -> None:
    files = sys.argv[1:] or sorted(glob.glob("deploy/sql/*.sql"))
    if not files:
        sys.exit("No .sql files to apply.")

    with pyodbc.connect(connection_string(), autocommit=False) as conn:
        cursor = conn.cursor()
        for path in files:
            print(f"Applying {path} ...")
            with open(path, encoding="utf-8") as fh:
                for batch in batches(fh.read()):
                    cursor.execute(batch)
            conn.commit()
    print("Done.")


if __name__ == "__main__":
    main()
