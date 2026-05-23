from __future__ import annotations

from dataclasses import dataclass
import json
from urllib.parse import quote, unquote


@dataclass(frozen=True)
class LocationCity:
    city: str
    latitude: float
    longitude: float


@dataclass(frozen=True)
class LocationCountry:
    country_code: str
    country_name: str
    cities: tuple[LocationCity, ...]


@dataclass(frozen=True)
class LocationContext:
    country_code: str
    country_name: str
    city: str
    latitude: float
    longitude: float

    @property
    def server_id(self) -> str:
        return f"{self.country_code.lower()}_{self.city.lower().replace(' ', '_')}"

    @property
    def is_global(self) -> bool:
        return self.country_code == GLOBAL_COUNTRY_CODE and self.city.lower() == GLOBAL_CITY.lower()


GLOBAL_COUNTRY_CODE = "GL"
GLOBAL_COUNTRY_NAME = "Global"
GLOBAL_CITY = "Global"


LOCATION_COUNTRIES: tuple[LocationCountry, ...] = (
    LocationCountry(
        country_code=GLOBAL_COUNTRY_CODE,
        country_name=GLOBAL_COUNTRY_NAME,
        cities=(LocationCity(GLOBAL_CITY, 0.0, 0.0),),
    ),
    LocationCountry(
        country_code="US",
        country_name="United States",
        cities=(
            LocationCity("New York", 40.7128, -74.0060),
            LocationCity("Los Angeles", 34.0522, -118.2437),
            LocationCity("Chicago", 41.8781, -87.6298),
        ),
    ),
    LocationCountry(
        country_code="GB",
        country_name="United Kingdom",
        cities=(
            LocationCity("London", 51.5072, -0.1276),
            LocationCity("Manchester", 53.4808, -2.2426),
            LocationCity("Birmingham", 52.4862, -1.8904),
        ),
    ),
    LocationCountry(
        country_code="DE",
        country_name="Germany",
        cities=(
            LocationCity("Berlin", 52.5200, 13.4050),
            LocationCity("Munich", 48.1351, 11.5820),
            LocationCity("Hamburg", 53.5511, 9.9937),
        ),
    ),
    LocationCountry(
        country_code="FR",
        country_name="France",
        cities=(
            LocationCity("Paris", 48.8566, 2.3522),
            LocationCity("Lyon", 45.7640, 4.8357),
            LocationCity("Marseille", 43.2965, 5.3698),
        ),
    ),
    LocationCountry(
        country_code="BA",
        country_name="Bosnia and Herzegovina",
        cities=(
            LocationCity("Sarajevo", 43.8563, 18.4131),
            LocationCity("Banja Luka", 44.7722, 17.1910),
            LocationCity("Mostar", 43.3438, 17.8078),
        ),
    ),
    LocationCountry(
        country_code="RS",
        country_name="Serbia",
        cities=(
            LocationCity("Belgrade", 44.7866, 20.4489),
            LocationCity("Novi Sad", 45.2671, 19.8335),
            LocationCity("Nis", 43.3209, 21.8958),
        ),
    ),
    LocationCountry(
        country_code="HR",
        country_name="Croatia",
        cities=(
            LocationCity("Zagreb", 45.8150, 15.9819),
            LocationCity("Split", 43.5081, 16.4402),
            LocationCity("Rijeka", 45.3271, 14.4422),
        ),
    ),
    LocationCountry(
        country_code="ME",
        country_name="Montenegro",
        cities=(
            LocationCity("Podgorica", 42.4304, 19.2594),
            LocationCity("Niksic", 42.7731, 18.9445),
            LocationCity("Budva", 42.2864, 18.8400),
        ),
    ),
)

COUNTRY_BY_CODE: dict[str, LocationCountry] = {item.country_code: item for item in LOCATION_COUNTRIES}
DEFAULT_LOCATION = LocationContext(
    country_code=GLOBAL_COUNTRY_CODE,
    country_name=GLOBAL_COUNTRY_NAME,
    city=GLOBAL_CITY,
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
                "cities": [city.city for city in country.cities],
            }
        )
    return payload


def normalize_location(country_code: str | None, city: str | None, country_name: str | None = None) -> LocationContext:
    if not country_code or not city:
        return DEFAULT_LOCATION

    normalized_country_code = country_code.strip().upper()
    normalized_city_label = city.strip()
    if len(normalized_country_code) != 2 or not normalized_city_label:
        return DEFAULT_LOCATION

    selected_country = COUNTRY_BY_CODE.get(normalized_country_code)
    if selected_country is None:
        normalized_country_name = country_name.strip() if country_name and country_name.strip() else normalized_country_code
        return LocationContext(
            country_code=normalized_country_code,
            country_name=normalized_country_name,
            city=normalized_city_label,
            latitude=0.0,
            longitude=0.0,
        )

    normalized_city = normalized_city_label.lower()
    selected_city = next(
        (item for item in selected_country.cities if item.city.lower() == normalized_city),
        None,
    )
    if selected_city is None:
        return LocationContext(
            country_code=selected_country.country_code,
            country_name=selected_country.country_name,
            city=normalized_city_label,
            latitude=0.0,
            longitude=0.0,
        )

    return LocationContext(
        country_code=selected_country.country_code,
        country_name=selected_country.country_name,
        city=selected_city.city,
        latitude=selected_city.latitude,
        longitude=selected_city.longitude,
    )


def encode_location_cookie_value(context: LocationContext) -> str:
    return quote(
        json.dumps(
            {
                "country_code": context.country_code,
                "country_name": context.country_name,
                "city": context.city,
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
    city = parsed.get("city") if isinstance(parsed, dict) else None
    return normalize_location(
        str(country_code) if country_code is not None else None,
        str(city) if city is not None else None,
        str(country_name) if country_name is not None else None,
    )
