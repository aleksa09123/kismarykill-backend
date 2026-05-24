from __future__ import annotations

from dataclasses import dataclass
import json
from urllib.parse import quote, unquote


@dataclass(frozen=True)
class LocationCountry:
    country_code: str
    country_name: str
    latitude: float
    longitude: float


@dataclass(frozen=True)
class LocationContext:
    country_code: str
    country_name: str
    latitude: float
    longitude: float

    @property
    def server_id(self) -> str:
        return self.country_code.lower()

    @property
    def is_global(self) -> bool:
        return self.country_code == GLOBAL_COUNTRY_CODE


GLOBAL_COUNTRY_CODE = "GL"
GLOBAL_COUNTRY_NAME = "Global"


LOCATION_COUNTRIES: tuple[LocationCountry, ...] = (
    LocationCountry(
        country_code=GLOBAL_COUNTRY_CODE,
        country_name=GLOBAL_COUNTRY_NAME,
        latitude=0.0,
        longitude=0.0,
    ),
    LocationCountry(
        country_code="US",
        country_name="United States",
        latitude=39.8283,
        longitude=-98.5795,
    ),
    LocationCountry(
        country_code="GB",
        country_name="United Kingdom",
        latitude=54.7024,
        longitude=-3.2766,
    ),
    LocationCountry(
        country_code="DE",
        country_name="Germany",
        latitude=51.1638,
        longitude=10.4478,
    ),
    LocationCountry(
        country_code="FR",
        country_name="France",
        latitude=46.2276,
        longitude=2.2137,
    ),
    LocationCountry(
        country_code="BA",
        country_name="Bosnia and Herzegovina",
        latitude=43.9159,
        longitude=17.6791,
    ),
    LocationCountry(
        country_code="RS",
        country_name="Serbia",
        latitude=44.0165,
        longitude=21.0059,
    ),
    LocationCountry(
        country_code="HR",
        country_name="Croatia",
        latitude=45.1,
        longitude=15.2,
    ),
    LocationCountry(
        country_code="ME",
        country_name="Montenegro",
        latitude=42.7087,
        longitude=19.3744,
    ),
)

COUNTRY_BY_CODE: dict[str, LocationCountry] = {item.country_code: item for item in LOCATION_COUNTRIES}
DEFAULT_LOCATION = LocationContext(
    country_code=GLOBAL_COUNTRY_CODE,
    country_name=GLOBAL_COUNTRY_NAME,
    latitude=0.0,
    longitude=0.0,
)


def available_locations_payload() -> list[dict[str, object]]:
    payload: list[dict[str, object]] = []
    for country in LOCATION_COUNTRIES:
        payload.append(
            {
                "country_code": country.country_code,
                "country_name": country.country_name,
            }
        )
    return payload


def normalize_location(
    country_code: str | None,
    country_name: str | None = None,
) -> LocationContext:
    if not country_code:
        return DEFAULT_LOCATION

    normalized_country_code = country_code.strip().upper()
    if len(normalized_country_code) != 2:
        return DEFAULT_LOCATION

    selected_country = COUNTRY_BY_CODE.get(normalized_country_code)
    if selected_country is None:
        normalized_country_name = country_name.strip() if country_name and country_name.strip() else normalized_country_code
        return LocationContext(
            country_code=normalized_country_code,
            country_name=normalized_country_name,
            latitude=0.0,
            longitude=0.0,
        )

    return LocationContext(
        country_code=selected_country.country_code,
        country_name=selected_country.country_name,
        latitude=selected_country.latitude,
        longitude=selected_country.longitude,
    )


def encode_location_cookie_value(context: LocationContext) -> str:
    return quote(
        json.dumps(
            {
                "country_code": context.country_code,
                "country_name": context.country_name,
                "latitude": context.latitude,
                "longitude": context.longitude,
            },
            separators=(",", ":"),
        )
    )


def decode_location_cookie_value(raw_cookie: str | None) -> LocationContext:
    if not raw_cookie:
        return DEFAULT_LOCATION

    try:
        parsed = json.loads(unquote(raw_cookie))
    except (ValueError, TypeError):
        return DEFAULT_LOCATION

    country_code = parsed.get("country_code") if isinstance(parsed, dict) else None
    country_name = parsed.get("country_name") if isinstance(parsed, dict) else None
    return normalize_location(
        str(country_code) if country_code is not None else None,
        str(country_name) if country_name is not None else None,
    )
