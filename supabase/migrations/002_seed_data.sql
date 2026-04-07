-- ============================================================
-- MetroPulse Baku - Seed Data
-- Populate stations and exits with realistic Baku Metro data
-- ============================================================

-- Stations
INSERT INTO
    stations (
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
        'st-005',
        'nariman-narimanov',
        'Nəriman Nərimanov',
        'Nəriman Nərimanov',
        'red',
        40.4012,
        49.8612,
        'commuter',
        1967
    ),
    (
        'st-006',
        'bakmil',
        'Bakmil',
        'Bakmil',
        'red',
        40.4112,
        49.8679,
        'residential',
        1967
    ),
    (
        'st-007',
        'ulduz',
        'Ulduz',
        'Ulduz',
        'red',
        40.4208,
        49.8731,
        'residential',
        1967
    ),
    (
        'st-008',
        'koroglu',
        'Koroğlu',
        'Koroğlu',
        'red',
        40.4310,
        49.8795,
        'commuter',
        1976
    ),
    (
        'st-009',
        'hazi-aslanov',
        'Həzi Aslanov',
        'Həzi Aslanov',
        'red',
        40.4156,
        49.9023,
        'commuter',
        1985
    ),
    (
        'st-010',
        'darnagul',
        'Dərnəgül',
        'Dərnəgül',
        'green',
        40.4423,
        49.8312,
        'residential',
        2016
    ),
    (
        'st-011',
        'avtovagzal',
        'Avtovağzal',
        'Avtovağzal',
        'green',
        40.4289,
        49.8231,
        'transfer',
        2016
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
    ),
    (
        'st-014',
        'elmler-akademiyasi',
        'Elmlər Akademiyası',
        'Elmlər Akademiyası',
        'green',
        40.3756,
        49.8512,
        'business',
        1967
    ),
    (
        'st-015',
        'inshaatchilar',
        'İnşaatçılar',
        'İnşaatçılar',
        'green',
        40.3678,
        49.8289,
        'residential',
        1967
    ),
    (
        'st-016',
        'khalglar-dostlugu',
        'Xalqlar Dostluğu',
        'Xalqlar Dostluğu',
        'green',
        40.3589,
        49.8167,
        'commuter',
        1967
    ),
    (
        'st-017',
        'ahmedli',
        'Əhmədli',
        'Əhmədli',
        'green',
        40.3489,
        49.8056,
        'residential',
        1976
    ),
    (
        'st-018',
        'hojasan',
        'Khojasan',
        'Khojasan',
        'green',
        40.3389,
        49.7956,
        'residential',
        1985
    ),
    (
        'st-019',
        'heydar-aliyev',
        'Heydər Əliyev',
        'Heydər Əliyev',
        'purple',
        40.4512,
        50.0089,
        'tourist',
        2016
    ),
    (
        'st-020',
        'khatai',
        'Xətai',
        'Xətai',
        'red',
        40.3934,
        49.8712,
        'mixed',
        1967
    ) ON CONFLICT (id) DO NOTHING;

-- Station exits
INSERT INTO
    station_exits (
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
        'Exit 1 – 28 May Street',
        '28 May küçəsi, Bakı',
        40.3799,
        49.8523,
        true
    ),
    (
        'ex-003-2',
        'st-003',
        2,
        'Exit 2 – Hüseyn Cavid Avenue',
        'Hüseyn Cavid prospekti, Bakı',
        40.3791,
        49.8509,
        false
    ),
    (
        'ex-003-3',
        'st-003',
        3,
        'Exit 3 – Railway Station',
        'Bakı Dəmiryol Stansiyası',
        40.3806,
        49.8531,
        true
    ),
    (
        'ex-013-1',
        'st-013',
        1,
        'Exit 1 – Nizami Street',
        'Nizami küçəsi, Bakı',
        40.3826,
        49.8459,
        true
    ),
    (
        'ex-013-2',
        'st-013',
        2,
        'Exit 2 – Fountains Square',
        'Fəvvarələr meydanı',
        40.3819,
        49.8448,
        true
    ),
    (
        'ex-002-1',
        'st-002',
        1,
        'Exit 1 – Neftchilar Avenue',
        'Neftçilər prospekti, Bakı',
        40.3706,
        49.8435,
        true
    ),
    (
        'ex-002-2',
        'st-002',
        2,
        'Exit 2 – Seaside Boulevard',
        'Dəniz kənarı Bulvar',
        40.3698,
        49.8427,
        true
    ),
    (
        'ex-001-1',
        'st-001',
        1,
        'Exit 1 – Old City Gate',
        'Qosha Qalanın yanı',
        40.3667,
        49.8376,
        false
    ),
    (
        'ex-001-2',
        'st-001',
        2,
        'Exit 2 – Neftchilar Avenue',
        'Neftçilər prospekti',
        40.3660,
        49.8368,
        true
    ) ON CONFLICT (station_id, exit_no) DO NOTHING;

-- Intraday profiles for commuter stations
INSERT INTO station_intraday_profiles (station_id, profile_type, weekday_pattern_json, weekend_pattern_json, confidence_note)
SELECT
  s.id,
  CASE
    WHEN s.station_type IN ('commuter', 'residential') THEN 'commuter-heavy'
    WHEN s.station_type = 'transfer'                   THEN 'transfer-heavy'
    WHEN s.station_type IN ('central', 'tourist')      THEN 'central'
    ELSE 'mixed-use'
  END,
  '[{"hour":6,"share":0.02},{"hour":7,"share":0.06},{"hour":8,"share":0.13},{"hour":9,"share":0.10},{"hour":10,"share":0.05},{"hour":11,"share":0.04},{"hour":12,"share":0.05},{"hour":13,"share":0.05},{"hour":14,"share":0.04},{"hour":15,"share":0.04},{"hour":16,"share":0.05},{"hour":17,"share":0.12},{"hour":18,"share":0.13},{"hour":19,"share":0.07},{"hour":20,"share":0.03},{"hour":21,"share":0.01},{"hour":22,"share":0.01}]'::JSONB,
  '[{"hour":8,"share":0.03},{"hour":9,"share":0.05},{"hour":10,"share":0.08},{"hour":11,"share":0.10},{"hour":12,"share":0.12},{"hour":13,"share":0.12},{"hour":14,"share":0.10},{"hour":15,"share":0.10},{"hour":16,"share":0.09},{"hour":17,"share":0.08},{"hour":18,"share":0.07},{"hour":19,"share":0.04},{"hour":20,"share":0.02}]'::JSONB,
  'Estimated from daily totals and station type. NOT observed hourly counts.'
FROM stations s
ON CONFLICT (station_id) DO NOTHING;