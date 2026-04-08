-- Correct line classification for purple line stations.
UPDATE stations
SET
    line = 'purple',
    updated_at = NOW()
WHERE
    slug IN (
        '8-noyabr',
        'memar-ajami',
        'avtovagzal',
        'hojasan'
    );