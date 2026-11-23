from dataclasses import dataclass, field
from datetime import date, timedelta
from decimal import Decimal


@dataclass
class Invoice:
    """An invoice that becomes overdue after `terms` days."""

    number: str
    total: Decimal
    issued: date
    terms: int = 30
    paid: bool = False
    tags: list[str] = field(default_factory=list)

    @property
    def due(self) -> date:
        return self.issued + timedelta(days=self.terms)

    def is_overdue(self, today: date | None = None) -> bool:
        # unpaid and past the due date
        today = today or date.today()
        return not self.paid and today > self.due

    def apply_discount(self, percent: float) -> Decimal:
        if not 0 <= percent <= 100:
            raise ValueError(f"invalid discount: {percent}")
        self.total *= Decimal(1 - percent / 100)
        return self.total.quantize(Decimal("0.01"))
