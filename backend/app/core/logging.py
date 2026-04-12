import logging
import sys
from app.core.config import get_settings


def setup_logging() -> logging.Logger:
    settings = get_settings()
    # Use effective_log_level: verbose locally, concise in production
    level = getattr(logging, settings.effective_log_level, logging.INFO)

    logging.basicConfig(
        level=level,
        format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S",
        handlers=[logging.StreamHandler(sys.stdout)],
    )

    # Quieten noisy third-party loggers
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("motor").setLevel(logging.WARNING)

    return logging.getLogger("axiom")


logger = setup_logging()
