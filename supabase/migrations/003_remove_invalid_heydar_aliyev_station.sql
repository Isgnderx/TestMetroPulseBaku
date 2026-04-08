-- Remove a non-existent metro station from live data.
DELETE FROM stations WHERE id = 'st-019' OR slug = 'heydar-aliyev';