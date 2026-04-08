-- Add the remaining station records required by the demand CSVs.

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
VALUES
    (
        'st-021',
        '20-yanvar',
        '20 Yanvar',
        '20 Yanvar',
        'red',
        40.4058,
        49.8093,
        'commuter',
        1981
    ),
    (
        'st-022',
        '8-noyabr',
        '8 Noyabr',
        '8 Noyabr',
        'green',
        40.3981,
        49.8474,
        'mixed',
        2022
    ),
    (
        'st-023',
        'azadliq-prospekti',
        'Azadliq Prospekti',
        'Azadliq Prospekti',
        'red',
        40.4235,
        49.8244,
        'residential',
        2009
    ),
    (
        'st-024',
        'jafar-cabbarli',
        'Jafar Jabbarli',
        'Cafar Cabbarli',
        'green',
        40.3791,
        49.8515,
        'transfer',
        1993
    ),
    (
        'st-026',
        'nasimi',
        'Nasimi',
        'Nasimi',
        'red',
        40.4138,
        49.8226,
        'residential',
        1985
    ),
    (
        'st-027',
        'neftchilar',
        'Neftchilar',
        'Neftchilar',
        'green',
        40.4211,
        49.9446,
        'commuter',
        1972
    ),
    (
        'st-028',
        'qara-qarayev',
        'Qara Qarayev',
        'Qara Qarayev',
        'green',
        40.4172,
        49.9381,
        'mixed',
        1972
    )
ON CONFLICT (id) DO NOTHING;

INSERT INTO station_intraday_profiles (
    station_id,
    profile_type,
    weekday_pattern_json,
    weekend_pattern_json,
    confidence_note
)
SELECT
    s.id,
    CASE
        WHEN s.station_type IN ('commuter', 'residential') THEN 'commuter-heavy'
        WHEN s.station_type = 'transfer' THEN 'transfer-heavy'
        WHEN s.station_type IN ('central', 'tourist') THEN 'central'
        ELSE 'mixed-use'
    END,
    '[{"hour":6,"share":0.02},{"hour":7,"share":0.06},{"hour":8,"share":0.13},{"hour":9,"share":0.10},{"hour":10,"share":0.05},{"hour":11,"share":0.04},{"hour":12,"share":0.05},{"hour":13,"share":0.05},{"hour":14,"share":0.04},{"hour":15,"share":0.04},{"hour":16,"share":0.05},{"hour":17,"share":0.12},{"hour":18,"share":0.13},{"hour":19,"share":0.07},{"hour":20,"share":0.03},{"hour":21,"share":0.01},{"hour":22,"share":0.01}]'::JSONB,
    '[{"hour":8,"share":0.03},{"hour":9,"share":0.05},{"hour":10,"share":0.08},{"hour":11,"share":0.10},{"hour":12,"share":0.12},{"hour":13,"share":0.12},{"hour":14,"share":0.10},{"hour":15,"share":0.10},{"hour":16,"share":0.09},{"hour":17,"share":0.08},{"hour":18,"share":0.07},{"hour":19,"share":0.04},{"hour":20,"share":0.02}]'::JSONB,
    'Estimated from daily totals and station type. NOT observed hourly counts.'
FROM stations s
WHERE s.id IN ('st-021', 'st-022', 'st-023', 'st-024', 'st-026', 'st-027', 'st-028')
ON CONFLICT (station_id) DO NOTHING;
