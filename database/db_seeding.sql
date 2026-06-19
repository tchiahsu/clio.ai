ROLLBACK;
SET search_path TO clio;
BEGIN;

TRUNCATE
  transactions,
  chat_messages,
  chat_history,
  statement_summary,
  budgets,
  goals,
  categories,
  merchants,
  statements,
  accounts,
  users
RESTART IDENTITY CASCADE;

-- Deterministic RNG so re-seeding produces the same demo data each time.
SELECT setseed(0.4242);

-- =========================
-- USERS (2)
-- demo@example.com is the showcase account the "View demo" button signs into.
-- =========================
INSERT INTO users (email, first_name, last_name, password_hash) VALUES
('demo@example.com',      'Demo',  'User', '$2b$10$oM7G/7B1HLktlU3KlrA4v.utlA0QxuEoCuYIdtkq38nBdTXaoDbJC'),
('casey.lin@example.com', 'Casey', 'Lin',  '$2b$10$oM7G/7B1HLktlU3KlrA4v.utlA0QxuEoCuYIdtkq38nBdTXaoDbJC');

-- =========================
-- ACCOUNTS (2 per user = 4). Identity ids 1..4 in insert order.
--   1 = Demo checking, 2 = Demo credit, 3 = Casey checking, 4 = Casey credit
-- =========================
INSERT INTO accounts (user_id, bank_name, account_number, account_type) VALUES
(1, 'Bank of America', 842917364, 'Checking'),
(1, 'Chase Sapphire',  590284716, 'Credit Card'),
(2, 'Eastern Bank',    173650928, 'Checking'),
(2, 'American Express',964205831, 'Credit Card');

-- =========================
-- MERCHANTS (Boston-flavored). Referenced by name in the transaction streams.
-- =========================
INSERT INTO merchants (merchant_name) VALUES
-- income / transfers
('HubSpot Payroll'), ('Mass General Brigham Payroll'), ('Interest Payment'),
('Savings Transfer'), ('Credit Card Payment'), ('Venmo'), ('Zelle'),
-- coffee / bakery
('Dunkin'), ('Starbucks'), ('Tatte Bakery & Cafe'), ('Flour Bakery'),
('George Howell Coffee'), ('Caffe Nero'), ('Blue Bottle Coffee'),
-- groceries
('Star Market'), ('Trader Joe''s'), ('Market Basket'), ('Whole Foods Market'), ('Stop & Shop'),
-- dining / fast food / delivery / alcohol
('Regina Pizzeria'), ('Legal Sea Foods'), ('Sweetgreen'), ('Chipotle'), ('Tasty Burger'),
('Anna''s Taqueria'), ('Shake Shack'), ('b.good'), ('Saloniki Greek'),
('DoorDash'), ('Uber Eats'), ('Grubhub'), ('Total Wine & More'), ('Trillium Brewing'), ('The Sevens Ale House'),
-- transport
('MBTA'), ('Bluebikes'), ('Uber'), ('Lyft'), ('Shell'), ('Gulf'), ('LAZ Parking'),
('Zipcar'), ('Logan Express'), ('Somerville Auto Repair'),
-- bills / utilities / insurance / rent
('Eversource'), ('National Grid'), ('Boston Water & Sewer'), ('Comcast Xfinity'),
('T-Mobile'), ('Verizon Wireless'), ('Lemonade Insurance'), ('Liberty Mutual'),
('Beacon Hill Apartments'), ('Somerville Realty'),
-- shopping
('Amazon'), ('Target'), ('Best Buy'), ('Apple'), ('IKEA'), ('Home Depot'),
('Marshalls'), ('Uniqlo'), ('CVS Pharmacy'), ('Walgreens'),
-- entertainment / subscriptions
('Netflix'), ('Spotify'), ('Hulu'), ('Disney+'), ('HBO Max'), ('YouTube Premium'),
('AMC Theatres'), ('Steam'), ('Red Sox Tickets'), ('TD Garden'), ('Boston Calling'),
('Museum of Fine Arts'), ('iCloud'), ('ChatGPT Plus'), ('Adobe'), ('GitHub'),
-- health / fitness
('Boston Sports Clubs'), ('Planet Fitness'), ('CVS MinuteClinic'), ('Mass General Brigham'),
-- travel
('JetBlue'), ('Delta Air Lines'), ('Amtrak'), ('Airbnb'), ('Marriott'),
-- education / books / pets / giving / misc
('Harvard Book Store'), ('Coursera'), ('Polka Dog Bakery'), ('Chewy'),
('Angell Animal Medical Center'), ('WBUR'), ('Greater Boston Food Bank'), ('Unknown');

-- =========================
-- CATEGORIES (identical two-level set for each user)
-- =========================
INSERT INTO categories (user_id, category_name, subcategory_name)
SELECT u.user_id, c.category_name, c.subcategory_name
FROM (VALUES (1), (2)) AS u(user_id)
CROSS JOIN (VALUES
  ('food','fast_food'), ('food','dining_out'), ('food','food_delivery'), ('food','groceries'),
  ('food','bakery'), ('food','coffee'), ('food','alcohol'),
  ('transport','fuel'), ('transport','rideshare'), ('transport','parking'), ('transport','public_transport'),
  ('transport','car_payment'), ('transport','car_insurance'), ('transport','car_maintenance'), ('transport','transportation'),
  ('shopping','shopping'), ('shopping','clothing'), ('shopping','electronics'),
  ('shopping','home_goods'), ('shopping','home_maintenance'), ('shopping','personal_care'),
  ('entertainment','streaming'), ('entertainment','music'), ('entertainment','video_games'),
  ('entertainment','entertainment'), ('entertainment','events'),
  ('subscriptions','software'), ('subscriptions','cloud_services'), ('subscriptions','subscriptions'),
  ('health','pharmacy'), ('health','healthcare'), ('health','fitness'),
  ('travel','lodging'), ('travel','flights'), ('travel','travel'),
  ('income','salary'), ('income','interest'), ('income','income'),
  ('transfers','transfers'),
  ('bills','insurance'), ('bills','utilities'), ('bills','rent'), ('bills','mortgage'),
  ('bills','phone'), ('bills','internet'), ('bills','fees'), ('bills','taxes'),
  ('education','education'), ('education','books'),
  ('pets','pets'),
  ('giving','donations'), ('giving','gifts'),
  ('misc','misc')
) AS c(category_name, subcategory_name);

-- =========================
-- STATEMENTS — 6 monthly statements (Jan–Jun 2026) per account = 24.
-- Generated by joining each account to a month series; identity assigns ids.
-- =========================
INSERT INTO statements
(user_id, account_id, period_start, period_end, file_name, file_hash, current_status, uploaded_at, parsed_at, error_message)
SELECT a.user_id, a.account_id,
       g.m::date,
       (g.m + INTERVAL '1 month' - INTERVAL '1 day')::date,
       a.prefix || to_char(g.m, 'YYYY_MM') || '.pdf',
       NULL,
       'complete',
       (g.m + INTERVAL '1 month' + INTERVAL '2 days'),
       (g.m + INTERVAL '1 month' + INTERVAL '2 days'),
       NULL
FROM (VALUES
  (1, 1, 'bofa_checking_'),
  (1, 2, 'chase_sapphire_'),
  (2, 3, 'eastern_checking_'),
  (2, 4, 'amex_')
) AS a(user_id, account_id, prefix)
CROSS JOIN generate_series(DATE '2026-01-01', DATE '2026-06-01', INTERVAL '1 month') AS g(m);

-- =========================
-- TRANSACTIONS
-- Each INSERT below is a recurring "stream": a generate_series of dates joined
-- to the statement that covers each date. Amounts vary within realistic ranges.
-- =========================

-- ---------------------------------------------------------------------------
-- USER 1 — Demo User (Beacon Hill, no car, T commuter, works at HubSpot)
--   checking = account 1, credit card = account 2
-- ---------------------------------------------------------------------------

-- Income: biweekly salary (checking)
INSERT INTO transactions (user_id, account_id, statement_id, merchant_id, category_id, category_confidence, transaction_date, description, amount)
SELECT 1, 1, s.statement_id,
  (SELECT merchant_id FROM merchants WHERE merchant_name='HubSpot Payroll'),
  (SELECT category_id FROM categories WHERE user_id=1 AND category_name='income' AND subcategory_name='salary'),
  0.99, g.d::date, 'HUBSPOT PAYROLL DIRECT DEP', ROUND((2550 + random()*200)::numeric, 2)
FROM generate_series(DATE '2026-01-02', DATE '2026-06-30', INTERVAL '14 days') g(d)
JOIN statements s ON s.account_id=1 AND g.d::date BETWEEN s.period_start AND s.period_end;

-- Income: monthly savings interest (checking)
INSERT INTO transactions (user_id, account_id, statement_id, merchant_id, category_id, category_confidence, transaction_date, description, amount)
SELECT 1, 1, s.statement_id,
  (SELECT merchant_id FROM merchants WHERE merchant_name='Interest Payment'),
  (SELECT category_id FROM categories WHERE user_id=1 AND category_name='income' AND subcategory_name='interest'),
  0.99, x.d, 'INTEREST PAYMENT', ROUND((1.5 + random()*6)::numeric, 2)
FROM generate_series(DATE '2026-01-01', DATE '2026-06-01', INTERVAL '1 month') g(m)
CROSS JOIN LATERAL (SELECT (g.m + INTERVAL '26 days')::date AS d) x
JOIN statements s ON s.account_id=1 AND x.d BETWEEN s.period_start AND s.period_end;

-- Fixed monthly bills & transfers (checking)
INSERT INTO transactions (user_id, account_id, statement_id, merchant_id, category_id, category_confidence, transaction_date, description, amount)
SELECT 1, 1, s.statement_id, m.merchant_id, c.category_id, b.conf, x.d, b.descr, b2.amount
FROM generate_series(DATE '2026-01-01', DATE '2026-06-01', INTERVAL '1 month') g(m)
CROSS JOIN (VALUES
  ('Beacon Hill Apartments','bills','rent',       0.99, 0,  'RENT - BEACON HILL APTS', -2450.00),
  ('MBTA',                  'transport','public_transport', 0.97, 1, 'MBTA MONTHLY LINKPASS', -90.00),
  ('Savings Transfer',      'transfers','transfers', 0.95, 2, 'TRANSFER TO SAVINGS', -600.00),
  ('Eversource',            'bills','utilities',   0.95, 4,  'EVERSOURCE ELECTRIC',  NULL),
  ('Comcast Xfinity',       'bills','internet',    0.96, 5,  'COMCAST XFINITY',      -89.99),
  ('National Grid',         'bills','utilities',   0.95, 6,  'NATIONAL GRID GAS',    NULL),
  ('T-Mobile',              'bills','phone',       0.96, 7,  'T-MOBILE AUTOPAY',     -75.00),
  ('Boston Water & Sewer',  'bills','utilities',   0.93, 9,  'BOSTON WATER & SEWER', NULL),
  ('Lemonade Insurance',    'bills','insurance',   0.94, 10, 'LEMONADE RENTERS INS', -16.00),
  ('Credit Card Payment',   'transfers','transfers', 0.95, 19, 'PAYMENT - CHASE SAPPHIRE', NULL)
) AS b(merchant, cat, sub, conf, day_offset, descr, fixed_amt)
CROSS JOIN LATERAL (SELECT (g.m + (b.day_offset || ' days')::interval)::date AS d) x
JOIN statements s ON s.account_id=1 AND x.d BETWEEN s.period_start AND s.period_end
CROSS JOIN LATERAL (SELECT (SELECT merchant_id FROM merchants WHERE merchant_name=b.merchant) AS merchant_id) m
CROSS JOIN LATERAL (SELECT (SELECT category_id FROM categories WHERE user_id=1 AND category_name=b.cat AND subcategory_name=b.sub) AS category_id) c
CROSS JOIN LATERAL (SELECT CASE
    WHEN b.merchant='Eversource'          THEN -ROUND((70 + random()*70)::numeric, 2)
    WHEN b.merchant='National Grid'       THEN -ROUND((45 + random()*120)::numeric, 2)
    WHEN b.merchant='Boston Water & Sewer'THEN -ROUND((28 + random()*22)::numeric, 2)
    WHEN b.merchant='Credit Card Payment' THEN -ROUND((900 + random()*500)::numeric, 2)
    ELSE b.fixed_amt END AS amount) b2;

-- Recurring discretionary spend (credit card) — defined as (merchant, cat, sub, cadence, lo, hi, conf, prefix)
INSERT INTO transactions (user_id, account_id, statement_id, merchant_id, category_id, category_confidence, transaction_date, description, amount)
SELECT 1, 2, s.statement_id,
  (SELECT merchant_id FROM merchants WHERE merchant_name=p.merchant),
  (SELECT category_id FROM categories WHERE user_id=1 AND category_name=p.cat AND subcategory_name=p.sub),
  p.conf, g.d::date, p.prefix || (1000 + (random()*8999)::int)::text,
  -ROUND((p.lo + random()*(p.hi - p.lo))::numeric, 2)
FROM (VALUES
  ('Dunkin',              'food','coffee',          '2 days',  2.75, 7.50, 0.96, 'DUNKIN #'),
  ('Starbucks',           'food','coffee',          '8 days',  4.50, 9.00, 0.95, 'STARBUCKS #'),
  ('Tatte Bakery & Cafe', 'food','bakery',          '7 days',  8.00, 22.00,0.92, 'TATTE BAKERY #'),
  ('Trader Joe''s',       'food','groceries',       '7 days',  40.00,95.00,0.94, 'TRADER JOES #'),
  ('Star Market',         'food','groceries',       '10 days', 35.00,110.00,0.93,'STAR MARKET #'),
  ('Regina Pizzeria',     'food','dining_out',      '11 days', 16.00,46.00,0.90, 'REGINA PIZZERIA #'),
  ('Legal Sea Foods',     'food','dining_out',      '17 days', 45.00,100.00,0.90,'LEGAL SEA FOODS #'),
  ('Sweetgreen',          'food','dining_out',      '7 days',  12.00,19.00,0.92, 'SWEETGREEN #'),
  ('Tasty Burger',        'food','fast_food',       '9 days',  9.00, 18.00,0.90, 'TASTY BURGER #'),
  ('DoorDash',            'food','food_delivery',   '7 days',  20.00,48.00,0.93, 'DOORDASH*'),
  ('Total Wine & More',   'food','alcohol',         '14 days', 22.00,70.00,0.91, 'TOTAL WINE #'),
  ('Uber',                'transport','rideshare',  '6 days',  9.00, 32.00,0.96, 'UBER *TRIP '),
  ('Lyft',                'transport','rideshare',  '9 days',  8.00, 28.00,0.96, 'LYFT *RIDE '),
  ('Bluebikes',           'transport','public_transport','5 days', 2.95,4.50,0.90,'BLUEBIKES #'),
  ('Amazon',              'shopping','shopping',    '6 days',  12.00,130.00,0.88,'AMAZON.COM*'),
  ('Target',              'shopping','home_goods',  '12 days', 20.00,85.00,0.86, 'TARGET #'),
  ('CVS Pharmacy',        'health','pharmacy',      '20 days', 8.00, 38.00,0.80, 'CVS/PHARMACY #')
) AS p(merchant, cat, sub, cadence, lo, hi, conf, prefix)
CROSS JOIN LATERAL generate_series(DATE '2026-01-03', DATE '2026-06-29', p.cadence::interval) g(d)
JOIN statements s ON s.account_id=2 AND g.d::date BETWEEN s.period_start AND s.period_end;

-- Monthly subscriptions & fitness (credit card)
INSERT INTO transactions (user_id, account_id, statement_id, merchant_id, category_id, category_confidence, transaction_date, description, amount)
SELECT 1, 2, s.statement_id,
  (SELECT merchant_id FROM merchants WHERE merchant_name=p.merchant),
  (SELECT category_id FROM categories WHERE user_id=1 AND category_name=p.cat AND subcategory_name=p.sub),
  p.conf, x.d, p.descr, p.amount
FROM generate_series(DATE '2026-01-01', DATE '2026-06-01', INTERVAL '1 month') g(m)
CROSS JOIN (VALUES
  ('Netflix',            'entertainment','streaming',     0.98, 15, 'NETFLIX.COM',        -15.49),
  ('Spotify',            'entertainment','music',         0.98, 15, 'SPOTIFY USA',        -11.99),
  ('Disney+',            'entertainment','streaming',     0.98, 16, 'DISNEY PLUS',        -13.99),
  ('iCloud',             'subscriptions','cloud_services',0.92, 3,  'APPLE.COM/BILL ICLOUD', -2.99),
  ('ChatGPT Plus',       'subscriptions','software',      0.90, 8,  'OPENAI CHATGPT PLUS',-20.00),
  ('Boston Sports Clubs','health','fitness',              0.95, 2,  'BOSTON SPORTS CLUBS',-49.00),
  ('Uniqlo',             'shopping','clothing',           0.85, 13, 'UNIQLO BOSTON',      -64.50),
  ('WBUR',               'giving','donations',            0.90, 18, 'WBUR MONTHLY GIFT',  -15.00)
) AS p(merchant, cat, sub, conf, day_offset, descr, amount)
CROSS JOIN LATERAL (SELECT (g.m + (p.day_offset || ' days')::interval)::date AS d) x
JOIN statements s ON s.account_id=2 AND x.d BETWEEN s.period_start AND s.period_end;

-- ---------------------------------------------------------------------------
-- USER 2 — Casey Lin (Somerville, owns a car + a dog, works at Mass General Brigham)
--   checking = account 3, credit card = account 4
-- ---------------------------------------------------------------------------

-- Income: biweekly salary (checking)
INSERT INTO transactions (user_id, account_id, statement_id, merchant_id, category_id, category_confidence, transaction_date, description, amount)
SELECT 2, 3, s.statement_id,
  (SELECT merchant_id FROM merchants WHERE merchant_name='Mass General Brigham Payroll'),
  (SELECT category_id FROM categories WHERE user_id=2 AND category_name='income' AND subcategory_name='salary'),
  0.99, g.d::date, 'MGB PAYROLL DIRECT DEP', ROUND((3000 + random()*300)::numeric, 2)
FROM generate_series(DATE '2026-01-02', DATE '2026-06-30', INTERVAL '14 days') g(d)
JOIN statements s ON s.account_id=3 AND g.d::date BETWEEN s.period_start AND s.period_end;

-- Income: monthly interest (checking)
INSERT INTO transactions (user_id, account_id, statement_id, merchant_id, category_id, category_confidence, transaction_date, description, amount)
SELECT 2, 3, s.statement_id,
  (SELECT merchant_id FROM merchants WHERE merchant_name='Interest Payment'),
  (SELECT category_id FROM categories WHERE user_id=2 AND category_name='income' AND subcategory_name='interest'),
  0.99, x.d, 'INTEREST PAYMENT', ROUND((2 + random()*8)::numeric, 2)
FROM generate_series(DATE '2026-01-01', DATE '2026-06-01', INTERVAL '1 month') g(m)
CROSS JOIN LATERAL (SELECT (g.m + INTERVAL '25 days')::date AS d) x
JOIN statements s ON s.account_id=3 AND x.d BETWEEN s.period_start AND s.period_end;

-- Fixed monthly bills & transfers (checking)
INSERT INTO transactions (user_id, account_id, statement_id, merchant_id, category_id, category_confidence, transaction_date, description, amount)
SELECT 2, 3, s.statement_id, m.merchant_id, c.category_id, b.conf, x.d, b.descr, b2.amount
FROM generate_series(DATE '2026-01-01', DATE '2026-06-01', INTERVAL '1 month') g(m)
CROSS JOIN (VALUES
  ('Somerville Realty',   'bills','rent',         0.99, 0,  'RENT - SOMERVILLE', -2100.00),
  ('Savings Transfer',    'transfers','transfers',0.95, 2,  'TRANSFER TO SAVINGS', -700.00),
  ('Eversource',          'bills','utilities',    0.95, 4,  'EVERSOURCE ELECTRIC', NULL),
  ('Comcast Xfinity',     'bills','internet',     0.96, 5,  'COMCAST XFINITY',     -79.99),
  ('National Grid',       'bills','utilities',    0.95, 6,  'NATIONAL GRID GAS',   NULL),
  ('Verizon Wireless',    'bills','phone',        0.96, 7,  'VERIZON WIRELESS',    -85.00),
  ('Boston Water & Sewer','bills','utilities',    0.93, 9,  'WATER & SEWER',       NULL),
  ('Lemonade Insurance',  'bills','insurance',    0.94, 10, 'LEMONADE RENTERS INS',-18.00),
  ('Liberty Mutual',      'transport','car_insurance', 0.95, 12, 'LIBERTY MUTUAL AUTO', -132.00),
  ('Credit Card Payment', 'transfers','transfers',0.95, 20, 'PAYMENT - AMEX',      NULL)
) AS b(merchant, cat, sub, conf, day_offset, descr, fixed_amt)
CROSS JOIN LATERAL (SELECT (g.m + (b.day_offset || ' days')::interval)::date AS d) x
JOIN statements s ON s.account_id=3 AND x.d BETWEEN s.period_start AND s.period_end
CROSS JOIN LATERAL (SELECT (SELECT merchant_id FROM merchants WHERE merchant_name=b.merchant) AS merchant_id) m
CROSS JOIN LATERAL (SELECT (SELECT category_id FROM categories WHERE user_id=2 AND category_name=b.cat AND subcategory_name=b.sub) AS category_id) c
CROSS JOIN LATERAL (SELECT CASE
    WHEN b.merchant='Eversource'           THEN -ROUND((80 + random()*80)::numeric, 2)
    WHEN b.merchant='National Grid'        THEN -ROUND((50 + random()*130)::numeric, 2)
    WHEN b.merchant='Boston Water & Sewer' THEN -ROUND((30 + random()*25)::numeric, 2)
    WHEN b.merchant='Credit Card Payment'  THEN -ROUND((700 + random()*600)::numeric, 2)
    ELSE b.fixed_amt END AS amount) b2;

-- Fuel & parking (checking — debit card)
INSERT INTO transactions (user_id, account_id, statement_id, merchant_id, category_id, category_confidence, transaction_date, description, amount)
SELECT 2, 3, s.statement_id,
  (SELECT merchant_id FROM merchants WHERE merchant_name=p.merchant),
  (SELECT category_id FROM categories WHERE user_id=2 AND category_name=p.cat AND subcategory_name=p.sub),
  p.conf, g.d::date, p.prefix || (100 + (random()*899)::int)::text,
  -ROUND((p.lo + random()*(p.hi - p.lo))::numeric, 2)
FROM (VALUES
  ('Shell',      'transport','fuel',    '9 days',  38.00, 60.00, 0.94, 'SHELL OIL #'),
  ('Gulf',       'transport','fuel',    '13 days', 35.00, 55.00, 0.94, 'GULF #'),
  ('LAZ Parking','transport','parking', '10 days', 8.00,  30.00, 0.85, 'LAZ PARKING #')
) AS p(merchant, cat, sub, cadence, lo, hi, conf, prefix)
CROSS JOIN LATERAL generate_series(DATE '2026-01-04', DATE '2026-06-29', p.cadence::interval) g(d)
JOIN statements s ON s.account_id=3 AND g.d::date BETWEEN s.period_start AND s.period_end;

-- Recurring discretionary spend (credit card)
INSERT INTO transactions (user_id, account_id, statement_id, merchant_id, category_id, category_confidence, transaction_date, description, amount)
SELECT 2, 4, s.statement_id,
  (SELECT merchant_id FROM merchants WHERE merchant_name=p.merchant),
  (SELECT category_id FROM categories WHERE user_id=2 AND category_name=p.cat AND subcategory_name=p.sub),
  p.conf, g.d::date, p.prefix || (1000 + (random()*8999)::int)::text,
  -ROUND((p.lo + random()*(p.hi - p.lo))::numeric, 2)
FROM (VALUES
  ('Dunkin',               'food','coffee',         '3 days',  2.75, 7.25, 0.96, 'DUNKIN #'),
  ('George Howell Coffee', 'food','coffee',         '7 days',  4.50, 8.50, 0.94, 'GEORGE HOWELL #'),
  ('Market Basket',        'food','groceries',      '7 days',  45.00,115.00,0.93,'MARKET BASKET #'),
  ('Whole Foods Market',   'food','groceries',      '11 days', 40.00,120.00,0.93,'WHOLE FOODS #'),
  ('Anna''s Taqueria',     'food','dining_out',     '6 days',  10.00,18.00,0.91, 'ANNAS TAQUERIA #'),
  ('Shake Shack',          'food','fast_food',      '12 days', 11.00,20.00,0.90, 'SHAKE SHACK #'),
  ('b.good',               'food','dining_out',     '7 days',  12.00,19.00,0.91, 'B.GOOD #'),
  ('Uber Eats',            'food','food_delivery',  '7 days',  18.00,48.00,0.93, 'UBER EATS*'),
  ('Trillium Brewing',     'food','alcohol',        '14 days', 20.00,60.00,0.90, 'TRILLIUM #'),
  ('Uber',                 'transport','rideshare', '11 days', 10.00,32.00,0.95, 'UBER *TRIP '),
  ('Amazon',               'shopping','shopping',   '7 days',  12.00,112.00,0.88,'AMAZON.COM*'),
  ('Target',               'shopping','home_goods', '14 days', 20.00,90.00,0.86, 'TARGET #'),
  ('Walgreens',            'health','pharmacy',     '18 days', 8.00, 36.00,0.80, 'WALGREENS #'),
  ('Polka Dog Bakery',     'pets','pets',           '21 days', 25.00,55.00,0.88, 'POLKA DOG #'),
  ('Chewy',                'pets','pets',           '28 days', 40.00,75.00,0.90, 'CHEWY.COM*')
) AS p(merchant, cat, sub, cadence, lo, hi, conf, prefix)
CROSS JOIN LATERAL generate_series(DATE '2026-01-03', DATE '2026-06-29', p.cadence::interval) g(d)
JOIN statements s ON s.account_id=4 AND g.d::date BETWEEN s.period_start AND s.period_end;

-- Monthly subscriptions & fitness (credit card)
INSERT INTO transactions (user_id, account_id, statement_id, merchant_id, category_id, category_confidence, transaction_date, description, amount)
SELECT 2, 4, s.statement_id,
  (SELECT merchant_id FROM merchants WHERE merchant_name=p.merchant),
  (SELECT category_id FROM categories WHERE user_id=2 AND category_name=p.cat AND subcategory_name=p.sub),
  p.conf, x.d, p.descr, p.amount
FROM generate_series(DATE '2026-01-01', DATE '2026-06-01', INTERVAL '1 month') g(m)
CROSS JOIN (VALUES
  ('Spotify',         'entertainment','music',      0.98, 15, 'SPOTIFY USA',          -11.99),
  ('Hulu',            'entertainment','streaming',  0.98, 15, 'HULU',                 -17.99),
  ('YouTube Premium', 'entertainment','streaming',  0.97, 16, 'YOUTUBE PREMIUM',      -13.99),
  ('Adobe',           'subscriptions','software',   0.90, 8,  'ADOBE CREATIVE CLOUD', -22.99),
  ('iCloud',          'subscriptions','cloud_services', 0.92, 3, 'APPLE.COM/BILL ICLOUD', -9.99),
  ('Planet Fitness',  'health','fitness',           0.95, 2,  'PLANET FITNESS',       -25.00),
  ('Greater Boston Food Bank','giving','donations', 0.90, 18, 'GBFB MONTHLY GIFT',    -20.00)
) AS p(merchant, cat, sub, conf, day_offset, descr, amount)
CROSS JOIN LATERAL (SELECT (g.m + (p.day_offset || ' days')::interval)::date AS d) x
JOIN statements s ON s.account_id=4 AND x.d BETWEEN s.period_start AND s.period_end;

-- ---------------------------------------------------------------------------
-- One-off purchases, trips, events, and a few unmatched (NULL category) rows.
-- merchant/category resolve to NULL when blank, exercising the classifier path.
-- ---------------------------------------------------------------------------
INSERT INTO transactions (user_id, account_id, statement_id, merchant_id, category_id, category_confidence, transaction_date, description, amount)
SELECT v.user_id, v.account_id, s.statement_id,
  (SELECT merchant_id FROM merchants WHERE merchant_name = v.merchant),
  (SELECT category_id FROM categories WHERE user_id = v.user_id AND category_name = v.cat AND subcategory_name = v.sub),
  v.conf, v.d, v.descr, v.amount
FROM (VALUES
  -- Demo (user 1)
  (1, 2, 'TD Garden',          'entertainment','events',     0.90, DATE '2026-02-14', 'TD GARDEN EVENT',        -160.00),
  (1, 2, 'Museum of Fine Arts','entertainment','entertainment',0.88, DATE '2026-03-08', 'MFA BOSTON ADMISSION',   -25.00),
  (1, 2, 'JetBlue',            'travel','flights',           0.90, DATE '2026-03-20', 'JETBLUE AIRWAYS',        -312.40),
  (1, 2, 'Airbnb',             'travel','lodging',           0.90, DATE '2026-03-21', 'AIRBNB * HMQ4 STAY',     -540.00),
  (1, 2, 'Red Sox Tickets',    'entertainment','events',     0.92, DATE '2026-04-12', 'RED SOX TICKETS',        -120.00),
  (1, 2, 'Boston Calling',     'entertainment','events',     0.92, DATE '2026-05-23', 'BOSTON CALLING FEST',    -185.00),
  (1, 1, NULL,                 NULL,           NULL,         0.00, DATE '2026-02-17', 'CHECK #1043',            -120.00),
  (1, 2, NULL,                 NULL,           NULL,         0.00, DATE '2026-04-09', 'SQ *UNKNOWN VENDOR',      -34.18),
  (1, 2, NULL,                 NULL,           NULL,         0.00, DATE '2026-05-27', 'POS PURCHASE 8841',       -12.99),
  -- Casey (user 2)
  (2, 4, 'Best Buy',           'shopping','electronics',     0.88, DATE '2026-02-22', 'BEST BUY #1402',         -639.99),
  (2, 4, 'Amtrak',             'travel','travel',            0.88, DATE '2026-04-03', 'AMTRAK NORTHEAST',        -89.00),
  (2, 4, 'Marriott',           'travel','lodging',           0.88, DATE '2026-04-04', 'MARRIOTT NYC',           -310.00),
  (2, 4, 'Mass General Brigham','health','healthcare',       0.90, DATE '2026-03-05', 'MGB VISIT COPAY',         -45.00),
  (2, 4, 'Angell Animal Medical Center','pets','pets',       0.92, DATE '2026-05-12', 'ANGELL ANIMAL MED',      -260.00),
  (2, 3, 'Somerville Auto Repair','transport','car_maintenance', 0.90, DATE '2026-04-15', 'SOMERVILLE AUTO REPAIR', -385.00),
  (2, 4, 'Red Sox Tickets',    'entertainment','events',     0.92, DATE '2026-05-03', 'RED SOX TICKETS',        -110.00),
  (2, 3, NULL,                 NULL,           NULL,         0.00, DATE '2026-02-19', 'ATM WITHDRAWAL',         -100.00),
  (2, 4, NULL,                 NULL,           NULL,         0.00, DATE '2026-03-28', 'SQ *POPUP MARKET',        -41.00)
) AS v(user_id, account_id, merchant, cat, sub, conf, d, descr, amount)
JOIN statements s ON s.account_id = v.account_id AND v.d BETWEEN s.period_start AND s.period_end;

-- =========================
-- STATEMENT SUMMARY — derived from the transactions above so totals always match.
-- Checking accounts carry a running balance from a base; credit cards show the
-- month's net activity.
-- =========================
WITH per_stmt AS (
  SELECT s.statement_id, s.account_id, s.period_start, acc.account_type,
    COALESCE(SUM(t.amount) FILTER (WHERE t.amount > 0), 0)  AS inc,
    COALESCE(-SUM(t.amount) FILTER (WHERE t.amount < 0), 0) AS exp,
    COALESCE(SUM(t.amount), 0)                              AS net
  FROM statements s
  JOIN accounts acc ON acc.account_id = s.account_id
  LEFT JOIN transactions t ON t.statement_id = s.statement_id
  GROUP BY s.statement_id, s.account_id, s.period_start, acc.account_type
),
running AS (
  SELECT *,
    SUM(net) OVER (PARTITION BY account_id ORDER BY period_start
                   ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING) AS prior_net
  FROM per_stmt
)
INSERT INTO statement_summary (statement_id, starting_balance, ending_balance, total_income, total_expenses)
SELECT statement_id,
  ROUND((CASE WHEN account_type='Checking' THEN 6000 + COALESCE(prior_net,0)       ELSE 0   END)::numeric, 2),
  ROUND((CASE WHEN account_type='Checking' THEN 6000 + COALESCE(prior_net,0) + net ELSE net END)::numeric, 2),
  ROUND(inc::numeric, 2),
  ROUND(exp::numeric, 2)
FROM running;

-- =========================
-- BUDGETS — a sensible monthly target per top-level category, for every statement.
-- =========================
INSERT INTO budgets (user_id, category_id, category_name, statement_id, amount)
SELECT s.user_id,
       (SELECT MIN(c.category_id) FROM categories c WHERE c.user_id = s.user_id AND c.category_name = b.cat),
       b.cat, s.statement_id, b.amount
FROM statements s
CROSS JOIN (VALUES
  ('bills',         2900.00),
  ('food',           950.00),
  ('shopping',       450.00),
  ('transport',      300.00),
  ('entertainment',  200.00),
  ('health',         120.00)
) AS b(cat, amount);

-- =========================
-- GOALS
-- =========================
INSERT INTO goals (user_id, title, target_amount, saved_amount, deadline) VALUES
(1, 'Emergency Fund',     12000.00,  5200.00, NULL),
(1, 'Trip to Japan',       6000.00,  2400.00, '2026-12-01'),
(1, 'New Laptop',          2400.00,  1100.00, '2026-09-01'),
(2, 'House Down Payment', 60000.00, 18000.00, '2027-06-01'),
(2, 'New Car',            20000.00,  7500.00, '2026-11-01'),
(2, 'Vet Emergency Fund',  3000.00,  1200.00, NULL);

-- =========================
-- CHAT HISTORY (identity ids 1..5) + messages
-- =========================
INSERT INTO chat_history (user_id, title, created_at) VALUES
(1, 'Where does my money go?',      '2026-06-02T10:15:00Z'),
(1, 'Coffee spending check',        '2026-06-08T08:40:00Z'),
(1, 'This month vs last',           '2026-06-12T19:05:00Z'),
(2, 'Am I saving enough?',          '2026-06-03T13:05:00Z'),
(2, 'Dog costs add up?',            '2026-06-10T21:22:00Z');

INSERT INTO chat_messages (chat_id, speaker_type, message_content, created_at) VALUES
(1, 'user', 'where does most of my money actually go?',                                                   '2026-06-02T10:15:10Z'),
(1, 'llm',  'Your largest categories are Bills (rent + utilities), Food, and Shopping. Want a merchant breakdown?', '2026-06-02T10:15:18Z'),
(1, 'user', 'yeah who do I pay the most',                                                                 '2026-06-02T10:16:03Z'),
(1, 'llm',  'Top merchants are Beacon Hill Apartments, Trader Joe''s, Amazon, and DoorDash.',             '2026-06-02T10:16:12Z'),
(2, 'user', 'am I spending too much on coffee?',                                                          '2026-06-08T08:40:05Z'),
(2, 'llm',  'You average a few Dunkin/Starbucks runs a week. It adds up to a modest monthly total — want the exact number?', '2026-06-08T08:40:15Z'),
(3, 'user', 'how does my spending this month compare to last month?',                                     '2026-06-12T19:05:11Z'),
(3, 'llm',  'Spending is slightly higher this month, mostly from events and dining out.',                 '2026-06-12T19:05:22Z'),
(4, 'user', 'whats my savings rate looking like',                                                         '2026-06-03T13:05:11Z'),
(4, 'llm',  'You are saving roughly 15% of take-home income after rent and bills. Trimming delivery would push it higher.', '2026-06-03T13:05:24Z'),
(5, 'user', 'how much is the dog costing me',                                                             '2026-06-10T21:22:10Z'),
(5, 'llm',  'Between Polka Dog, Chewy, and a vet visit, pet spending is a noticeable line item this period.', '2026-06-10T21:22:20Z');

COMMIT;
