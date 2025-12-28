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
-- USERS
-- =========================
INSERT INTO users (email, first_name, last_name) VALUES
('tony@example.com', 'Tony', 'Hsu'),
('alex@example.com', 'Alex', 'Rivera');

-- =========================
-- ACCOUNTS (2 per user)
-- =========================
INSERT INTO accounts (user_id, bank_name, account_number, account_type) VALUES
(1, 'Chase', 842917364, 'Checking'),
(1, 'American Express', 590284716, 'Credit Card'),
(2, 'Bank of America', 173650928, 'Checking'),
(2, 'Capital One', 964205831, 'Credit Card');

-- =========================
-- MERCHANTS
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
-- CATEGORIES (per-user; same names but distinct IDs)
-- Tony categories will be 1..17
-- Alex categories will be 18..34
-- =========================
INSERT INTO categories (user_id, category_name) VALUES
-- Tony (user_id=1) -> category_id 1..17
(1, 'Income'),           -- 1
(1, 'Rent'),             -- 2
(1, 'Groceries'),        -- 3
(1, 'Dining Out'),       -- 4
(1, 'Coffee'),           -- 5
(1, 'Transportation'),   -- 6
(1, 'Gas'),              -- 7
(1, 'Utilities'),        -- 8
(1, 'Subscriptions'),    -- 9
(1, 'Shopping'),         -- 10
(1, 'Health'),           -- 11
(1, 'Fitness'),          -- 12
(1, 'Travel'),           -- 13
(1, 'Insurance'),        -- 14
(1, 'Transfers'),        -- 15
(1, 'Home'),             -- 16
(1, 'Education'),        -- 17

-- Alex (user_id=2) -> category_id 18..34
(2, 'Income'),           -- 18
(2, 'Rent'),             -- 19
(2, 'Groceries'),        -- 20
(2, 'Dining Out'),       -- 21
(2, 'Coffee'),           -- 22
(2, 'Transportation'),   -- 23
(2, 'Gas'),              -- 24
(2, 'Utilities'),        -- 25
(2, 'Subscriptions'),    -- 26
(2, 'Shopping'),         -- 27
(2, 'Health'),           -- 28
(2, 'Fitness'),          -- 29
(2, 'Travel'),           -- 30
(2, 'Insurance'),        -- 31
(2, 'Transfers'),        -- 32
(2, 'Home'),             -- 33
(2, 'Education');        -- 34

-- =========================
-- STATEMENTS (2 months for each account = 8 statements)
-- statement_id will be 1..8
-- =========================
INSERT INTO statements (user_id, account_id, period_start, period_end, file_name, current_status) VALUES
-- Tony: Chase Checking (Jan, Feb)
(1, 1, '2025-01-01', '2025-01-31', 'chase_checking_2025_01.pdf', 'complete'),
(1, 1, '2025-02-01', '2025-02-28', 'chase_checking_2025_02.pdf', 'complete'),

-- Tony: Amex CC (Jan, Feb)
(1, 2, '2025-01-01', '2025-01-31', 'amex_cc_2025_01.pdf', 'complete'),
(1, 2, '2025-02-01', '2025-02-28', 'amex_cc_2025_02.pdf', 'processing'),

-- Alex: BoA Checking (Jan, Feb)
(2, 3, '2025-01-01', '2025-01-31', 'bofa_checking_2025_01.pdf', 'complete'),
(2, 3, '2025-02-01', '2025-02-28', 'bofa_checking_2025_02.pdf', 'complete'),

-- Alex: Capital One CC (Jan, Feb)
(2, 4, '2025-01-01', '2025-01-31', 'cap1_cc_2025_01.pdf', 'failed'),
(2, 4, '2025-02-01', '2025-02-28', 'cap1_cc_2025_02.pdf', 'complete');

-- =========================
-- STATEMENT SUMMARY
-- =========================
INSERT INTO statement_summary (statement_id, starting_balance, ending_balance, total_income, total_expenses) VALUES
(1, 4200.00, 5050.12, 6200.00, 5349.88),
(2, 5050.12, 4825.44, 6200.00, 6424.68),
(3, 0.00, -1832.21, 0.00, 1832.21),
(4, -1832.21, -2140.55, 0.00, 308.34),
(5, 2100.00, 2608.33, 5200.00, 4691.67),
(6, 2608.33, 1984.10, 5200.00, 5824.23),
(7, 0.00, 0.00, 0.00, 0.00),
(8, 0.00, -1460.98, 0.00, 1460.98);

-- =========================
-- CHAT HISTORY (2 threads each)
-- chat_id will be 1..4
-- =========================
INSERT INTO chat_history (user_id, title, created_at) VALUES
(1, 'January spending review', '2025-02-02T10:15:00Z'),
(1, 'Help categorize merchants',  '2025-02-10T19:40:00Z'),
(2, 'Budget check-in',            '2025-02-03T13:05:00Z'),
(2, 'Why is cashflow down?',      '2025-02-15T21:22:00Z');

INSERT INTO chat_messages (chat_id, speaker_type, message_content, created_at) VALUES
-- Tony chat 1
(1, 'user', 'Can you summarize my January spending and top categories?', '2025-02-02T10:15:10Z'),
(1, 'llm',  'Sure. In January you spent most on Rent, Groceries, and Dining Out. Your discretionary spend was mainly Coffee + Shopping. Want a breakdown by merchant?', '2025-02-02T10:15:18Z'),
(1, 'user', 'Yes—show top merchants and any anomalies.', '2025-02-02T10:16:03Z'),
(1, 'llm',  'Top merchants: Landlord/Rent, Whole Foods/Trader Joe’s, Amazon, Uber/Lyft. Anomalies: a larger-than-usual IKEA/Home Depot run and higher rideshare usage mid-month.', '2025-02-02T10:16:15Z'),

-- Tony chat 2
(2, 'user', 'Merchant "SHELL OIL 1234" should be Gas right?', '2025-02-10T19:40:05Z'),
(2, 'llm',  'Yes—"Shell" and similar fuel merchants typically map to Gas. I’d assign Gas with high confidence (0.9+).', '2025-02-10T19:40:16Z'),
(2, 'user', 'What about "UBER *TRIP"?', '2025-02-10T19:41:02Z'),
(2, 'llm',  'That’s Transportation. If you split categories, it can be Rideshare/Transportation. Confidence ~0.95.', '2025-02-10T19:41:09Z'),

-- Alex chat 3
(3, 'user', 'Am I hitting my savings goal this month?', '2025-02-03T13:05:11Z'),
(3, 'llm',  'Based on your Feb-to-date expenses vs income, you’re slightly below a 10% savings rate. Cutting Dining Out and Shopping by ~15% would put you back on track.', '2025-02-03T13:05:24Z'),

-- Alex chat 4
(4, 'user', 'My cashflow looks worse than January—why?', '2025-02-15T21:22:10Z'),
(4, 'llm',  'Two drivers: higher utilities and a spike in travel-related purchases. Also, fewer income credits posted by mid-month can temporarily lower cashflow.', '2025-02-15T21:22:26Z');

-- =========================
-- TRANSACTIONS
-- =========================

-- Tony (user_id=1) - Chase Checking statement 1 (Jan) statement_id=1
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
(1, 1, 1, 2, 15, 0.85, '2025-01-24', 'VENMO TRANSFER', -120.00);

-- Tony (user_id=1) - Amex CC statement 3 (Jan) statement_id=3
INSERT INTO transactions
(user_id, account_id, statement_id, merchant_id, category_id, category_confidence, transaction_date, description, amount)
VALUES
(1, 2, 3, 5, 3, 0.93, '2025-01-03', 'WHOLE FOODS #1022', -86.15),
(1, 2, 3, 6, 3, 0.93, '2025-01-06', 'TRADER JOE''S', -54.27),
(1, 2, 3, 7, 5, 0.96, '2025-01-07', 'STARBUCKS', -6.45),
(1, 2, 3, 25, 5, 0.95, '2025-01-08', 'DUNKIN', -4.12),
(1, 2, 3, 8, 6, 0.97, '2025-01-09', 'UBER *TRIP', -18.70),
(1, 2, 3, 9, 6, 0.97, '2025-01-10', 'LYFT RIDE', -15.22),
(1, 2, 3, 23, 4, 0.92, '2025-01-11', 'CHIPOTLE', -13.89),
(1, 2, 3, 24, 4, 0.92, '2025-01-12', 'SWEETGREEN', -16.40),
(1, 2, 3, 33, 4, 0.85, '2025-01-14', 'LOCAL BISTRO DINNER', -48.33),
(1, 2, 3, 12, 9, 0.98, '2025-01-15', 'NETFLIX.COM', -15.49),
(1, 2, 3, 13, 9, 0.98, '2025-01-15', 'SPOTIFY', -11.99),
(1, 2, 3, 4, 10, 0.88, '2025-01-18', 'AMAZON MARKETPLACE', -72.64),
(1, 2, 3, 19, 10, 0.88, '2025-01-19', 'TARGET', -34.18),
(1, 2, 3, 20, 11, 0.70, '2025-01-20', 'CVS PHARMACY', -18.27),
(1, 2, 3, 35, 11, 0.70, '2025-01-22', 'WALGREENS', -22.41),
(1, 2, 3, 26, 12, 0.95, '2025-01-23', 'PLANET FITNESS', -25.00),
(1, 2, 3, 10, 7, 0.94, '2025-01-24', 'SHELL OIL', -42.10),
(1, 2, 3, 32, 6, 0.75, '2025-01-25', 'PARKING GARAGE', -12.00),
(1, 2, 3, 18, 10, 0.80, '2025-01-26', 'APPLE.COM/BILL', -9.99),
(1, 2, 3, NULL, NULL, 0.00, '2025-01-28', 'UNRECOGNIZED MERCHANT 5831', -27.55);

-- Tony (user_id=1) - Chase Checking statement 2 (Feb) statement_id=2
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
(1, 1, 2, N
