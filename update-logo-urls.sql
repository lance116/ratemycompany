-- SQL statements to update company logos

-- Run these in Supabase SQL Editor

UPDATE companies SET logo_url = '/figma.png' WHERE name = 'Figma';
UPDATE companies SET logo_url = '/notion.png' WHERE name = 'Notion';
UPDATE companies SET logo_url = '/oracle.png' WHERE name = 'Oracle';

-- Companies without matching logos (need manual download):
-- Accenture
-- Amazon
-- GitHub
-- Google
-- IBM
-- Intel
-- LinkedIn
-- Meta
-- Pinterest
-- Salesforce
-- Tesla
-- Twitch
-- Uber

-- Summary: 3 matched, 13 unmatched
