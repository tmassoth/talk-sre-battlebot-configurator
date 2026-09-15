import logging
import uuid

logger = logging.getLogger(__name__)

# Mock "database": an in-memory store standing in for the real orders table.
# Replace _MOCK_ORDERS / save_order with a real driver (e.g. pyodbc against
# Azure SQL, mirroring backend/db.py) once persistence is wired up.
_MOCK_ORDERS: dict[str, dict] = {}

# Sensitive fields that must not be persisted or logged in the clear.
_SENSITIVE_FIELDS = ("card_number", "card_cvc")


def save_order(order: dict) -> str:
    """Store an order in the mock database and return its generated id."""
    order_id = str(uuid.uuid4())
    _MOCK_ORDERS[order_id] = _redact(order)
    logger.info("Saved order %s to mock database (%d total)", order_id, len(_MOCK_ORDERS))
    return order_id


def _redact(order: dict) -> dict:
    """Return a copy of the order with card details masked before storage."""
    customer = order.get("customer")
    if not isinstance(customer, dict):
        return order

    masked_customer = dict(customer)
    for field in _SENSITIVE_FIELDS:
        value = masked_customer.get(field)
        if isinstance(value, str) and value:
            digits = value.replace(" ", "")
            masked_customer[field] = "*" * max(len(digits) - 4, 0) + digits[-4:]

    return {**order, "customer": masked_customer}
