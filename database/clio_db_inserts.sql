SET search_path TO clio;

BEGIN;

-- Make IDs deterministic every time you run the seed
TRUNCATE
  transactions,
  chat_messages,
  chat_history,
  statement_summary,
  categories,
  merchants,
  statements,
  accounts,
  users
RESTART IDENTITY CASCADE;

-- =========================
-- USERS (3)
-- =========================
INSERT INTO users (email, first_name, last_name) VALUES
('tony@example.com', 'Tony', 'Hsu'),      -- user_id = 1
('alex@example.com', 'Alex', 'Rivera'),   -- user_id = 2
('maya@example.com', 'Maya', 'Chen');     -- user_id = 3

-- =========================
-- ACCOUNTS (2 per user = 6)
-- =========================
INSERT INTO accounts (user_id, bank_name, account_number, account_type) VALUES
(1, 'Chase', 842917364, 'Checking'),             -- account_id = 1
(1, 'American Express', 590284716, 'Credit Card'),-- account_id = 2
(2, 'Bank of America', 173650928, 'Checking'),   -- account_id = 3
(2, 'Capital One', 964205831, 'Credit Card'),    -- account_id = 4
(3, 'Wells Fargo', 228450190, 'Checking'),       -- account_id = 5
(3, 'Discover', 771120994, 'Credit Card');       -- account_id = 6

-- =========================
-- MERCHANTS (40)
-- =========================
INSERT INTO merchants (merchant_name) VALUES
('Payroll - ACME Corp'),             -- 1
('Venmo'),                           -- 2
('Zelle'),                           -- 3
('Amazon'),                          -- 4
('Whole Foods'),                     -- 5
('Trader Joe''s'),                   -- 6
('Starbucks'),                       -- 7
('Uber'),                            -- 8
('Lyft'),                            -- 9
('Shell'),                           -- 10
('Exxon'),                           -- 11
('Netflix'),                         -- 12
('Spotify'),                         -- 13
('Comcast'),                         -- 14
('National Grid'),                   -- 15
('City Water'),                      -- 16
('Landlord / Rent'),                 -- 17
('Apple'),                           -- 18
('Target'),                          -- 19
('CVS'),                             -- 20
('Delta Airlines'),                  -- 21
('Airbnb'),                          -- 22
('Chipotle'),                        -- 23
('Sweetgreen'),                      -- 24
('Dunkin'),                          -- 25
('Gym - Planet Fitness'),            -- 26
('Home Depot'),                      -- 27
('IKEA'),                            -- 28
('Interest Payment'),                -- 29
('Transfer: Checking <-> CC'),       -- 30
('Insurance - Geico'),               -- 31
('Parking'),                         -- 32
('Restaurant - Local Bistro'),       -- 33
('Gas - Local Station'),             -- 34
('Pharmacy - Walgreens'),            -- 35
('Microsoft'),                       -- 36
('Google'),                          -- 37
('Eversource'),                      -- 38
('T-Mobile'),                        -- 39
('MIT Coop / Books');                -- 40

-- =========================
-- CATEGORIES (17 per user = 51)
-- =========================
INSERT INTO categories (user_id, category_name) VALUES
-- Tony (user_id=1) -> category_id 1..17
(1, 'Income'),
(1, 'Rent'),
(1, 'Groceries'),
(1, 'Dining Out'),
(1, 'Coffee'),
(1, 'Transportation'),
(1, 'Gas'),
(1, 'Utilities'),
(1, 'Subscriptions'),
(1, 'Shopping'),
(1, 'Health'),
(1, 'Fitness'),
(1, 'Travel'),
(1, 'Insurance'),
(1, 'Transfers'),
(1, 'Home'),
(1, 'Education'),

-- Alex (user_id=2) -> category_id 18..34
(2, 'Income'),
(2, 'Rent'),
(2, 'Groceries'),
(2, 'Dining Out'),
(2, 'Coffee'),
(2, 'Transportation'),
(2, 'Gas'),
(2, 'Utilities'),
(2, 'Subscriptions'),
(2, 'Shopping'),
(2, 'Health'),
(2, 'Fitness'),
(2, 'Travel'),
(2, 'Insurance'),
(2, 'Transfers'),
(2, 'Home'),
(2, 'Education'),

-- Maya (user_id=3) -> category_id 35..51
(3, 'Income'),
(3, 'Rent'),
(3, 'Groceries'),
(3, 'Dining Out'),
(3, 'Coffee'),
(3, 'Transportation'),
(3, 'Gas'),
(3, 'Utilities'),
(3, 'Subscriptions'),
(3, 'Shopping'),
(3, 'Health'),
(3, 'Fitness'),
(3, 'Travel'),
(3, 'Insurance'),
(3, 'Transfers'),
(3, 'Home'),
(3, 'Education');

-- =========================
-- STATEMENTS (14)
-- - include complete/processing/failed
-- - include some "just uploaded" (NULL account + NULL period)
-- =========================
INSERT INTO statements
(user_id, account_id, period_start, period_end, file_name, current_status, uploaded_at, parsed_at, error_message)
VALUES
-- Tony: Chase Checking (Jan, Feb, Mar) - complete, complete, processing
(1, 1, '2025-01-01', '2025-01-31', 'chase_checking_2025_01.pdf', 'complete', '2025-02-02T09:12:00Z', '2025-02-02T09:13:20Z', NULL),
(1, 1, '2025-02-01', '2025-02-28', 'chase_checking_2025_02.pdf', 'complete', '2025-03-02T09:11:00Z', '2025-03-02T09:13:10Z', NULL),
(1, 1, '2025-03-01', '2025-03-31', 'chase_checking_2025_03.pdf', 'processing', '2025-04-02T09:11:00Z', NULL, NULL),

-- Tony: Amex CC (Jan, Feb, Mar) - complete, failed, queued
(1, 2, '2025-01-01', '2025-01-31', 'amex_cc_2025_01.pdf', 'complete', '2025-02-01T20:10:00Z', '2025-02-01T20:12:10Z', NULL),
(1, 2, '2025-02-01', '2025-02-28', 'amex_cc_2025_02.pdf', 'failed',   '2025-03-01T20:10:00Z', NULL, 'PDF parse failed: unsupported table layout'),
(1, 2, NULL, NULL, 'amex_cc_upload_pending.pdf', 'queued', '2025-03-15T18:33:00Z', NULL, NULL),

-- Alex: BoA Checking (Jan, Feb) - complete, complete
(2, 3, '2025-01-01', '2025-01-31', 'bofa_checking_2025_01.pdf', 'complete', '2025-02-03T12:02:00Z', '2025-02-03T12:03:40Z', NULL),
(2, 3, '2025-02-01', '2025-02-28', 'bofa_checking_2025_02.pdf', 'complete', '2025-03-03T12:02:00Z', '2025-03-03T12:03:35Z', NULL),

-- Alex: Capital One CC (Jan, Feb) - failed, complete
(2, 4, '2025-01-01', '2025-01-31', 'cap1_cc_2025_01.pdf', 'failed',   '2025-02-04T08:45:00Z', NULL, 'CSV missing required columns: amount'),
(2, 4, '2025-02-01', '2025-02-28', 'cap1_cc_2025_02.pdf', 'complete', '2025-03-04T08:45:00Z', '2025-03-04T08:47:10Z', NULL),

-- Maya: Wells Fargo Checking (Jan, Feb) - complete, processing
(3, 5, '2025-01-01', '2025-01-31', 'wf_checking_2025_01.pdf', 'complete', '2025-02-05T15:01:00Z', '2025-02-05T15:04:00Z', NULL),
(3, 5, '2025-02-01', '2025-02-28', 'wf_checking_2025_02.pdf', 'processing', '2025-03-05T15:01:00Z', NULL, NULL),

-- Maya: Discover CC (Jan) - complete
(3, 6, '2025-01-01', '2025-01-31', 'discover_cc_2025_01.pdf', 'complete', '2025-02-06T18:22:00Z', '2025-02-06T18:24:30Z', NULL),

-- A “dangling upload” example: statement exists, not yet assigned to account/period (queued)
(2, NULL, NULL, NULL, 'unknown_bank_upload.pdf', 'queued', '2025-03-10T11:12:00Z', NULL, NULL);

-- statement_id now 1..14

-- =========================
-- STATEMENT SUMMARY (only for completed statements)
-- =========================
INSERT INTO statement_summary (statement_id, starting_balance, ending_balance, total_income, total_expenses) VALUES
(1, 4200.00, 5050.12, 6200.00, 5349.88),
(2, 5050.12, 4825.44, 6200.00, 6424.68),
(4, 0.00, -1832.21, 0.00, 1832.21),
(7, 2100.00, 2608.33, 5200.00, 4691.67),
(8, 2608.33, 1984.10, 5200.00, 5824.23),
(10, 0.00, -1460.98, 0.00, 1460.98),
(11, 3300.00, 3899.50, 5800.00, 5200.50),
(13, 0.00, -980.10, 0.00, 980.10);

-- =========================
-- CHAT HISTORY (6 threads)
-- =========================
INSERT INTO chat_history (user_id, title, created_at) VALUES
(1, 'January spending review', '2025-02-02T10:15:00Z'),
(1, 'Help categorize merchants',  '2025-02-10T19:40:00Z'),
(1, 'Why did my utilities spike?', '2025-03-04T09:20:00Z'),
(2, 'Budget check-in',            '2025-02-03T13:05:00Z'),
(2, 'Why is cashflow down?',      '2025-02-15T21:22:00Z'),
(3, 'Travel spend analysis',      '2025-02-20T14:10:00Z');

INSERT INTO chat_messages (chat_id, speaker_type, message_content, created_at) VALUES
-- Tony chat 1
(1, 'user', 'Can you summarize my January spending and top categories?', '2025-02-02T10:15:10Z'),
(1, 'llm',  'In January, top spend categories were Rent, Groceries, and Dining Out. Want a merchant breakdown and anomalies?', '2025-02-02T10:15:18Z'),
(1, 'user', 'Yes—show top merchants and any anomalies.', '2025-02-02T10:16:03Z'),
(1, 'llm',  'Top merchants: Landlord/Rent, Whole Foods/Trader Joe’s, Amazon, Uber/Lyft. Anomaly: higher home improvement spend.', '2025-02-02T10:16:15Z'),

-- Tony chat 2
(2, 'user', 'Merchant "SHELL OIL 1234" should be Gas right?', '2025-02-10T19:40:05Z'),
(2, 'llm',  'Yes—assign Gas with high confidence (0.9+).', '2025-02-10T19:40:16Z'),
(2, 'user', 'What about "UBER *TRIP"?', '2025-02-10T19:41:02Z'),
(2, 'llm',  'That’s Transportation (rideshare). Confidence ~0.95.', '2025-02-10T19:41:09Z'),

-- Tony chat 3
(3, 'user', 'My utilities were unusually high—what drove that?', '2025-03-04T09:20:05Z'),
(3, 'llm',  'National Grid and Comcast increased. Also a one-off Eversource payment appears.', '2025-03-04T09:20:16Z'),

-- Alex chat 4
(4, 'user', 'Am I hitting my savings goal this month?', '2025-02-03T13:05:11Z'),
(4, 'llm',  'You are slightly below a 10% savings rate. Cutting Dining Out + Shopping by ~15% would help.', '2025-02-03T13:05:24Z'),

-- Alex chat 5
(5, 'user', 'My cashflow looks worse than January—why?', '2025-02-15T21:22:10Z'),
(5, 'llm',  'Higher utilities and a spike in travel purchases. Also income timing can temporarily reduce cashflow.', '2025-02-15T21:22:26Z'),

-- Maya chat 6
(6, 'user', 'Break down my travel spending and biggest vendors.', '2025-02-20T14:10:10Z'),
(6, 'llm',  'Most travel spend was on Delta + Airbnb. Want it split by month and trip?', '2025-02-20T14:10:21Z');

-- =========================
-- TRANSACTIONS (Lots)
-- Strategy:
-- - Put transactions under completed statements primarily
-- - Also include some under processing/queued/failed to test edge cases
-- - Include uncategorized rows with NULL merchant/category + confidence 0
-- =========================

-- -------------------------
-- Tony (user=1) Chase Checking statement 1 (Jan) statement_id=1, account_id=1
-- -------------------------
INSERT INTO transactions
(user_id, account_id, statement_id, merchant_id, category_id, category_confidence, transaction_date, description, amount)
VALUES
(1, 1, 1, 1, 1, 0.99, '2025-01-02', 'ACME PAYROLL DIRECT DEP', 3100.00),
(1, 1, 1, 17, 2, 0.98, '2025-01-03', 'RENT PAYMENT', -2100.00),
(1, 1, 1, 14, 8, 0.95, '2025-01-05', 'COMCAST INTERNET', -89.99),
(1, 1, 1, 15, 8, 0.94, '2025-01-06', 'NATIONAL GRID AUTOPAY', -132.40),
(1, 1, 1, 39, 8, 0.92, '2025-01-07', 'T-MOBILE', -75.00),
(1, 1, 1, 2, 15, 0.85, '2025-01-08', 'VENMO TRANSFER TO AMEX', -500.00),
(1, 1, 1, 3, 15, 0.85, '2025-01-10', 'ZELLE FROM ROOMMATE', 650.00),
(1, 1, 1, 16, 8, 0.90, '2025-01-12', 'CITY WATER BILL', -48.22),
(1, 1, 1, 31, 14, 0.90, '2025-01-14', 'GEICO INSURANCE', -115.67),
(1, 1, 1, 30, 15, 0.88, '2025-01-15', 'PAYMENT TO AMEX CARD', -650.00),
(1, 1, 1, NULL, NULL, 0.00, '2025-01-16', 'MISC ONLINE PAYMENT', -23.18),
(1, 1, 1, 1, 1, 0.99, '2025-01-17', 'ACME PAYROLL DIRECT DEP', 3100.00),
(1, 1, 1, 27, 16, 0.78, '2025-01-20', 'HOME DEPOT IMPROVEMENT', -164.32),
(1, 1, 1, 28, 16, 0.78, '2025-01-21', 'IKEA FURNITURE', -299.99),
(1, 1, 1, 2, 15, 0.85, '2025-01-24', 'VENMO TRANSFER', -120.00),
(1, 1, 1, 20, 11, 0.70, '2025-01-25', 'CVS PHARMACY', -18.27),
(1, 1, 1, 25, 5, 0.95, '2025-01-26', 'DUNKIN', -6.83),
(1, 1, 1, 33, 4, 0.86, '2025-01-27', 'LOCAL BISTRO DINNER', -62.19),
(1, 1, 1, 10, 7, 0.94, '2025-01-28', 'SHELL OIL', -41.73),
(1, 1, 1, 8, 6, 0.97, '2025-01-29', 'UBER *TRIP', -19.88),
(1, 1, 1, 4, 10, 0.88, '2025-01-30', 'AMAZON MARKETPLACE', -83.12);

-- -------------------------
-- Tony (user=1) Chase Checking statement 2 (Feb) statement_id=2, account_id=1
-- -------------------------
INSERT INTO transactions
(user_id, account_id, statement_id, merchant_id, category_id, category_confidence, transaction_date, description, amount)
VALUES
(1, 1, 2, 1, 1, 0.99, '2025-02-01', 'ACME PAYROLL DIRECT DEP', 3100.00),
(1, 1, 2, 17, 2, 0.98, '2025-02-03', 'RENT PAYMENT', -2100.00),
(1, 1, 2, 14, 8, 0.95, '2025-02-04', 'COMCAST INTERNET', -89.99),
(1, 1, 2, 15, 8, 0.94, '2025-02-05', 'NATIONAL GRID AUTOPAY', -146.12),
(1, 1, 2, 39, 8, 0.92, '2025-02-06', 'T-MOBILE', -75.00),
(1, 1, 2, 30, 15, 0.88, '2025-02-07', 'PAYMENT TO AMEX CARD', -720.00),
(1, 1, 2, 31, 14, 0.90, '2025-02-14', 'GEICO INSURANCE', -115.67),
(1, 1, 2, 1, 1, 0.99, '2025-02-15', 'ACME PAYROLL DIRECT DEP', 3100.00),
(1, 1, 2, 40, 17, 0.90, '2025-02-16', 'TEXTBOOKS / COURSE MATERIALS', -126.50),
(1, 1, 2, 3, 15, 0.80, '2025-02-18', 'ZELLE TO FRIEND', -85.00),
(1, 1, 2, 6, 3, 0.92, '2025-02-19', 'TRADER JOE''S', -73.44),
(1, 1, 2, 5, 3, 0.92, '2025-02-22', 'WHOLE FOODS', -92.18),
(1, 1, 2, 33, 4, 0.86, '2025-02-23', 'LOCAL BISTRO DINNER', -58.10),
(1, 1, 2, 27, 16, 0.78, '2025-02-24', 'HOME DEPOT', -214.19),
(1, 1, 2, NULL, NULL, 0.00, '2025-02-25', 'UNKNOWN VENDOR 1842', -31.11),
(1, 1, 2, 32, 6, 0.74, '2025-02-26', 'PARKING GARAGE', -14.00),
(1, 1, 2, 10, 7, 0.94, '2025-02-27', 'SHELL OIL', -44.06);

-- -------------------------
-- Tony (user=1) Amex CC statement 4 (Jan) statement_id=4, account_id=2
-- -------------------------
INSERT INTO transactions
(user_id, account_id, statement_id, merchant_id, category_id, category_confidence, transaction_date, description, amount)
VALUES
(1, 2, 4, 5, 3, 0.93, '2025-01-03', 'WHOLE FOODS #1022', -86.15),
(1, 2, 4, 6, 3, 0.93, '2025-01-06', 'TRADER JOE''S', -54.27),
(1, 2, 4, 7, 5, 0.96, '2025-01-07', 'STARBUCKS', -6.45),
(1, 2, 4, 25, 5, 0.95, '2025-01-08', 'DUNKIN', -4.12),
(1, 2, 4, 8, 6, 0.97, '2025-01-09', 'UBER *TRIP', -18.70),
(1, 2, 4, 9, 6, 0.97, '2025-01-10', 'LYFT RIDE', -15.22),
(1, 2, 4, 23, 4, 0.92, '2025-01-11', 'CHIPOTLE', -13.89),
(1, 2, 4, 24, 4, 0.92, '2025-01-12', 'SWEETGREEN', -16.40),
(1, 2, 4, 33, 4, 0.85, '2025-01-14', 'LOCAL BISTRO DINNER', -48.33),
(1, 2, 4, 12, 9, 0.98, '2025-01-15', 'NETFLIX.COM', -15.49),
(1, 2, 4, 13, 9, 0.98, '2025-01-15', 'SPOTIFY', -11.99),
(1, 2, 4, 4, 10, 0.88, '2025-01-18', 'AMAZON MARKETPLACE', -72.64),
(1, 2, 4, 19, 10, 0.88, '2025-01-19', 'TARGET', -34.18),
(1, 2, 4, 20, 11, 0.70, '2025-01-20', 'CVS PHARMACY', -18.27),
(1, 2, 4, 35, 11, 0.70, '2025-01-22', 'WALGREENS', -22.41),
(1, 2, 4, 26, 12, 0.95, '2025-01-23', 'PLANET FITNESS', -25.00),
(1, 2, 4, 10, 7, 0.94, '2025-01-24', 'SHELL OIL', -42.10),
(1, 2, 4, 32, 6, 0.75, '2025-01-25', 'PARKING GARAGE', -12.00),
(1, 2, 4, 18, 10, 0.80, '2025-01-26', 'APPLE.COM/BILL', -9.99),
(1, 2, 4, NULL, NULL, 0.00, '2025-01-28', 'UNRECOGNIZED MERCHANT 5831', -27.55),
(1, 2, 4, 21, 13, 0.88, '2025-01-29', 'DELTA AIR LINES', -224.10),
(1, 2, 4, 22, 13, 0.88, '2025-01-30', 'AIRBNB RESERVATION', -312.55);

-- -------------------------
-- Alex (user=2) BoA Checking statement 7 (Jan) statement_id=7, account_id=3
-- -------------------------
INSERT INTO transactions
(user_id, account_id, statement_id, merchant_id, category_id, category_confidence, transaction_date, description, amount)
VALUES
(2, 3, 7, 1, 18, 0.99, '2025-01-02', 'PAYROLL DIRECT DEP', 2600.00),
(2, 3, 7, 17, 19, 0.98, '2025-01-03', 'RENT PAYMENT', -1650.00),
(2, 3, 7, 14, 25, 0.94, '2025-01-04', 'COMCAST INTERNET', -79.99),
(2, 3, 7, 38, 25, 0.92, '2025-01-06', 'EVERSOURCE ELECTRIC', -143.10),
(2, 3, 7, 16, 25, 0.92, '2025-01-07', 'CITY WATER', -41.00),
(2, 3, 7, 6, 20, 0.92, '2025-01-10', 'TRADER JOE''S', -64.22),
(2, 3, 7, 7, 22, 0.94, '2025-01-11', 'STARBUCKS', -7.90),
(2, 3, 7, 8, 23, 0.96, '2025-01-12', 'UBER TRIP', -16.20),
(2, 3, 7, 4, 27, 0.86, '2025-01-13', 'AMAZON', -55.88),
(2, 3, 7, 12, 26, 0.98, '2025-01-15', 'NETFLIX', -15.49),
(2, 3, 7, 13, 26, 0.98, '2025-01-15', 'SPOTIFY', -11.99),
(2, 3, 7, 31, 31, 0.90, '2025-01-18', 'GEICO', -104.33),
(2, 3, 7, 3, 32, 0.80, '2025-01-20', 'ZELLE TRANSFER', -120.00),
(2, 3, 7, NULL, NULL, 0.00, '2025-01-23', 'UNMATCHED LINE ITEM', -22.10),
(2, 3, 7, 25, 22, 0.93, '2025-01-25', 'DUNKIN', -4.55);

-- -------------------------
-- Alex (user=2) BoA Checking statement 8 (Feb) statement_id=8, account_id=3
-- -------------------------
INSERT INTO transactions
(user_id, account_id, statement_id, merchant_id, category_id, category_confidence, transaction_date, description, amount)
VALUES
(2, 3, 8, 1, 18, 0.99, '2025-02-01', 'PAYROLL DIRECT DEP', 2600.00),
(2, 3, 8, 17, 19, 0.98, '2025-02-03', 'RENT PAYMENT', -1650.00),
(2, 3, 8, 38, 25, 0.92, '2025-02-05', 'EVERSOURCE', -159.20),
(2, 3, 8, 14, 25, 0.92, '2025-02-06', 'COMCAST', -79.99),
(2, 3, 8, 6, 20, 0.92, '2025-02-07', 'TRADER JOE''S', -72.41),
(2, 3, 8, 33, 21, 0.86, '2025-02-09', 'LOCAL BISTRO', -46.25),
(2, 3, 8, 4, 27, 0.86, '2025-02-12', 'AMAZON', -94.33),
(2, 3, 8, 8, 23, 0.95, '2025-02-13', 'UBER', -18.44),
(2, 3, 8, 32, 23, 0.70, '2025-02-16', 'PARKING', -14.00),
(2, 3, 8, NULL, NULL, 0.00, '2025-02-18', 'MISC ONLINE', -30.00),
(2, 3, 8, 1, 18, 0.99, '2025-02-15', 'PAYROLL DIRECT DEP', 2600.00);

-- -------------------------
-- Alex (user=2) Capital One CC statement 10 (Feb) statement_id=10, account_id=4
-- -------------------------
INSERT INTO transactions
(user_id, account_id, statement_id, merchant_id, category_id, category_confidence, transaction_date, description, amount)
VALUES
(2, 4, 10, 23, 21, 0.90, '2025-02-02', 'CHIPOTLE', -15.42),
(2, 4, 10, 24, 21, 0.88, '2025-02-03', 'SWEETGREEN', -17.98),
(2, 4, 10, 7, 22, 0.95, '2025-02-04', 'STARBUCKS', -6.85),
(2, 4, 10, 4, 27, 0.85, '2025-02-06', 'AMAZON', -120.44),
(2, 4, 10, 19, 27, 0.85, '2025-02-07', 'TARGET', -42.20),
(2, 4, 10, 12, 26, 0.98, '2025-02-10', 'NETFLIX', -15.49),
(2, 4, 10, 13, 26, 0.98, '2025-02-10', 'SPOTIFY', -11.99),
(2, 4, 10, 20, 28, 0.70, '2025-02-11', 'CVS', -22.10),
(2, 4, 10, 35, 28, 0.70, '2025-02-14', 'WALGREENS', -19.20),
(2, 4, 10, 21, 30, 0.85, '2025-02-18', 'DELTA', -280.11),
(2, 4, 10, 22, 30, 0.85, '2025-02-19', 'AIRBNB', -399.32),
(2, 4, 10, NULL, NULL, 0.00, '2025-02-22', 'UNKNOWN TXN', -27.55);

-- -------------------------
-- Maya (user=3) Wells Fargo Checking statement 11 (Jan) statement_id=11, account_id=5
-- -------------------------
INSERT INTO transactions
(user_id, account_id, statement_id, merchant_id, category_id, category_confidence, transaction_date, description, amount)
VALUES
(3, 5, 11, 1, 35, 0.99, '2025-01-03', 'PAYROLL DIRECT DEP', 2900.00),
(3, 5, 11, 17, 36, 0.98, '2025-01-04', 'RENT', -1800.00),
(3, 5, 11, 5, 37, 0.92, '2025-01-06', 'WHOLE FOODS', -102.33),
(3, 5, 11, 6, 37, 0.92, '2025-01-08', 'TRADER JOE''S', -76.20),
(3, 5, 11, 14, 42, 0.92, '2025-01-10', 'COMCAST', -69.99),
(3, 5, 11, 38, 42, 0.92, '2025-01-12', 'EVERSOURCE', -151.88),
(3, 5, 11, 39, 42, 0.92, '2025-01-12', 'T-MOBILE', -65.00),
(3, 5, 11, 25, 39, 0.92, '2025-01-13', 'DUNKIN', -5.23),
(3, 5, 11, 33, 38, 0.86, '2025-01-15', 'LOCAL BISTRO', -44.77),
(3, 5, 11, 26, 46, 0.92, '2025-01-18', 'PLANET FITNESS', -25.00),
(3, 5, 11, 31, 48, 0.90, '2025-01-19', 'GEICO', -118.21),
(3, 5, 11, NULL, NULL, 0.00, '2025-01-22', 'ODD CHARGE', -19.90);

-- -------------------------
-- Maya (user=3) Discover CC statement 13 (Jan) statement_id=13, account_id=6
-- -------------------------
INSERT INTO transactions
(user_id, account_id, statement_id, merchant_id, category_id, category_confidence, transaction_date, description, amount)
VALUES
(3, 6, 13, 12, 43, 0.98, '2025-01-05', 'NETFLIX', -15.49),
(3, 6, 13, 13, 43, 0.98, '2025-01-05', 'SPOTIFY', -11.99),
(3, 6, 13, 4, 44, 0.86, '2025-01-07', 'AMAZON', -98.14),
(3, 6, 13, 19, 44, 0.86, '2025-01-10', 'TARGET', -33.88),
(3, 6, 13, 23, 38, 0.88, '2025-01-12', 'CHIPOTLE', -14.55),
(3, 6, 13, 24, 38, 0.88, '2025-01-13', 'SWEETGREEN', -16.22),
(3, 6, 13, 7, 39, 0.93, '2025-01-14', 'STARBUCKS', -6.10),
(3, 6, 13, 32, 40, 0.70, '2025-01-18', 'PARKING', -10.00),
(3, 6, 13, 21, 47, 0.85, '2025-01-22', 'DELTA', -210.33),
(3, 6, 13, 22, 47, 0.85, '2025-01-24', 'AIRBNB', -355.66),
(3, 6, 13, NULL, NULL, 0.00, '2025-01-28', 'UNMATCHED', -27.55);

-- -------------------------
-- Edge cases:
-- - Transactions that exist but statement_id is NULL (e.g., imported from another source)
-- - Transactions linked to a statement that is processing (statement_id=3)
-- -------------------------
INSERT INTO transactions
(user_id, account_id, statement_id, merchant_id, category_id, category_confidence, transaction_date, description, amount)
VALUES
(1, 1, NULL, 4, 10, 0.70, '2025-03-02', 'AMAZON (manual import)', -42.18),
(2, 3, NULL, 7, 22, 0.80, '2025-03-03', 'STARBUCKS (manual import)', -5.60),

-- statement_id=3 is processing (Tony checking Mar) — partial ingestion
(1, 1, 3, 1, 1, 0.99, '2025-03-01', 'ACME PAYROLL DIRECT DEP', 3100.00),
(1, 1, 3, 17, 2, 0.95, '2025-03-03', 'RENT PAYMENT', -2100.00),
(1, 1, 3, NULL, NULL, 0.00, '2025-03-04', 'PENDING PARSE LINE', -12.34);

COMMIT;
