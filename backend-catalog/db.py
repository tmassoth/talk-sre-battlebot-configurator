import os

import pyodbc

DB_SERVER = os.getenv("DB_SERVER")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")

if not DB_SERVER or not DB_NAME:
    raise RuntimeError("DB_SERVER and DB_NAME must be set (see backend/.env.example).")


def _connection_string():
    parts = [
        "DRIVER={ODBC Driver 18 for SQL Server}",
        f"SERVER={DB_SERVER}",
        f"DATABASE={DB_NAME}",
        "Encrypt=yes",
        "TrustServerCertificate=no",
        "Connection Timeout=30",
    ]
    if DB_USER:
        parts.append(f"UID={DB_USER}")
        parts.append(f"PWD={DB_PASSWORD}")
    else:
        # No user set -> Azure AD / managed identity (az login, MSI, ...).
        parts.append("Authentication=ActiveDirectoryDefault")
    return ";".join(parts) + ";"


def get_connection():
    return pyodbc.connect(_connection_string())


def get_colors():
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT color_id, color_label, hex_code, price_eur
            FROM dbo.colors
            ORDER BY sort_order, color_label
            """
        )
        return [
            {
                "id": row.color_id,
                "label": row.color_label,
                "hex": row.hex_code,
                "price": row.price_eur,
            }
            for row in cursor.fetchall()
        ]


def get_engines():
    # Grouped by powertrain to mirror the front-end's ENGINES shape.
    grouped = {}
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT engine_id, powertrain, engine_label, power_output, price_eur
            FROM dbo.engines
            ORDER BY sort_order, engine_label
            """
        )
        for row in cursor.fetchall():
            key = (row.powertrain or "").lower()
            grouped.setdefault(key, []).append(
                {
                    "id": row.engine_id,
                    "label": row.engine_label,
                    "power": row.power_output,
                    "price": row.price_eur,
                }
            )
    return grouped


def get_maintenance_mode():
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT setting_value FROM dbo.settings WHERE setting_key = ?",
            "maintenance_mode",
        )
        row = cursor.fetchone()
    return row is not None and str(row.setting_value).lower() == "true"
