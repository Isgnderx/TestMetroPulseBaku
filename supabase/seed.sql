-- Seed-ready starter data for Phase 2 local development.
-- This keeps the schema testable before production ETL is wired.

INSERT INTO
    public.stations (
        id,
        slug,
        name,
        name_az,
        line,
        lat,
        lon,
        station_type,
        opened_year
    )
VALUES (
        'st-001',
        'icheri-sheher',
        'İçəri Şəhər',
        'İçəri Şəhər',
        'red',
        40.3664,
        49.8373,
        'central',
        1967
    ),
    (
        'st-002',
        'sahil',
        'Sahil',
        'Sahil',
        'red',
        40.3703,
        49.8431,
        'central',
        1967
    ),
    (
        'st-003',
        '28-may',
        '28 May',
        '28 May',
        'red',
        40.3795,
        49.8519,
        'transfer',
        1967
    ),
    (
        'st-004',
        'ganjlik',
        'Gənclik',
        'Gənclik',
        'red',
        40.3912,
        49.8567,
        'mixed',
        1967
    ),
    (
        'st-012',
        'memar-ajami',
        'Memar Əcəmi',
        'Memar Əcəmi',
        'green',
        40.4089,
        49.8173,
        'mixed',
        1985
    ),
    (
        'st-013',
        'nizami',
        'Nizami',
        'Nizami',
        'green',
        40.3823,
        49.8456,
        'central',
        1967
    ) ON CONFLICT (id) DO NOTHING;

INSERT INTO
    public.station_exits (
        id,
        station_id,
        exit_no,
        exit_label,
        address_text,
        lat,
        lon,
        is_accessible
    )
VALUES (
        'ex-003-1',
        'st-003',
        1,
        'Exit 1 - 28 May Street',
        '28 May kucesi, Baki',
        40.3799,
        49.8523,
        true
    ),
    (
        'ex-003-2',
        'st-003',
        2,
        'Exit 2 - Railway Station',
        'Baki Demiryol Stansiyasi',
        40.3806,
        49.8531,
        true
    ),
    (
        'ex-013-1',
        'st-013',
        1,
        'Exit 1 - Nizami Street',
        'Nizami kucesi, Baki',
        40.3826,
        49.8459,
        true
    ) ON CONFLICT (station_id, exit_no) DO NOTHING;