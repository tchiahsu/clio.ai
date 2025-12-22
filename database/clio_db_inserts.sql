SET search_path TO clio;

BEGIN;

-- =========================
-- USERS
-- =========================
INSERT INTO users (user_id, email, first_name, last_name) VALUES
(1, 'tony@example.com', 'Tony', 'Hsu'),
(2, 'alex@example.com', 'Alex', 'Rivera');

-- =========================
-- ACCOUNTS (2 per user)
-- =========================
INSERT INTO accounts (account_id, user_id, bank_name, account_type) VALUES
(1, 1, 'Chase', 'Checking'),
(2, 1, 'American Express', 'Credit Card'),
(3, 2, 'Bank of America', 'Checking'),
(4, 2, 'Capital One', 'Credit Card');

-- =========================
-- MERCHANTS
-- =========================
INSERT INTO merchants (merchant_id, merchant_name) VALUES
(1, 'Payroll - ACME Corp'),
(2, 'Venmo'),
(3, 'Zelle'),
(4, 'Amazon'),
(5, 'Whole Foods'),
(6, 'Trader Joe''s'),
(7, 'Starbucks'),
(8, 'Uber'),
(9, 'Lyft'),
(10, 'Shell'),
(11, 'Exxon'),
(12, 'Netflix'),
(13, 'Spotify'),
(14, 'Comcast'),
(15, 'National Grid'),
(16, 'City Water'),
(17, 'Landlord / Rent'),
(18, 'Apple'),
(19, 'Target'),
(20, 'CVS'),
(21, 'Delta Airlines'),
(22, 'Airbnb'),
(23, 'Chipotle'),
(24, 'Sweetgreen'),
(25, 'Dunkin'),
(26, 'Gym - Planet Fitness'),
(27, 'Home Depot'),
(28, 'IKEA'),
(29, 'Interest Payment'),
(30, 'Transfer: Checking <-> CC'),
(31, 'Insurance - Geico'),
(32, 'Parking'),
(33, 'Restaurant - Local Bistro'),
(34, 'Gas - Local Station'),
(35, 'Pharmacy - Walgreens'),
(36, 'Microsoft'),
(37, 'Google'),
(38, 'Eversource'),
(39, 'T-Mobile'),
(40, 'MIT Coop / Books');

-- =========================
-- CATEGORIES (per-user; same names but distinct IDs)
-- =========================
INSERT INTO categories (category_id, user_id, category_name) VALUES
-- Tony (user_id=1)
(1, 1, 'Income'),
(2, 1, 'Rent'),
(3, 1, 'Groceries'),
(4, 1, 'Dining Out'),
(5, 1, 'Coffee'),
(6, 1, 'Transportation'),
(7, 1, 'Gas'),
(8, 1, 'Utilities'),
(9, 1, 'Subscriptions'),
(10, 1, 'Shopping'),
(11, 1, 'Health'),
(12, 1, 'Fitness'),
(13, 1, 'Travel'),
(14, 1, 'Insurance'),
(15, 1, 'Transfers'),
(16, 1, 'Home'),
(17, 1, 'Education'),

-- Alex (user_id=2)
(101, 2, 'Income'),
(102, 2, 'Rent'),
(103, 2, 'Groceries'),
(104, 2, 'Dining Out'),
(105, 2, 'Coffee'),
(106, 2, 'Transportation'),
(107, 2, 'Gas'),
(108, 2, 'Utilities'),
(109, 2, 'Subscriptions'),
(110, 2, 'Shopping'),
(111, 2, 'Health'),
(112, 2, 'Fitness'),
(113, 2, 'Travel'),
(114, 2, 'Insurance'),
(115, 2, 'Transfers'),
(116, 2, 'Home'),
(117, 2, 'Education');

-- =========================
-- STATEMENTS (2 months for each account = 8 statements)
-- =========================
INSERT INTO statements (statement_id, user_id, account_id, period_start, period_end, file_name, current_status) VALUES
-- Tony: Chase Checking (Jan, Feb)
(1, 1, 1, '2025-01-01', '2025-01-31', 'chase_checking_2025_01.pdf', 'complete'),
(2, 1, 1, '2025-02-01', '2025-02-28', 'chase_checking_2025_02.pdf', 'complete'),

-- Tony: Amex CC (Jan, Feb)
(3, 1, 2, '2025-01-01', '2025-01-31', 'amex_cc_2025_01.pdf', 'complete'),
(4, 1, 2, '2025-02-01', '2025-02-28', 'amex_cc_2025_02.pdf', 'processing'),

-- Alex: BoA Checking (Jan, Feb)
(5, 2, 3, '2025-01-01', '2025-01-31', 'bofa_checking_2025_01.pdf', 'complete'),
(6, 2, 3, '2025-02-01', '2025-02-28', 'bofa_checking_2025_02.pdf', 'complete'),

-- Alex: Capital One CC (Jan, Feb)
(7, 2, 4, '2025-01-01', '2025-01-31', 'cap1_cc_2025_01.pdf', 'failed'),
(8, 2, 4, '2025-02-01', '2025-02-28', 'cap1_cc_2025_02.pdf', 'complete');

-- =========================
-- STATEMENT SUMMARY
-- (Numbers are plausible; they don't have to exactly match transactions for testing UI)
-- =========================
INSERT INTO statement_summary (summary_id, statement_id, starting_balance, ending_balance, total_income, total_expenses) VALUES
(1, 1, 4200.00, 5050.12, 6200.00, 5349.88),
(2, 2, 5050.12, 4825.44, 6200.00, 6424.68),
(3, 3, 0.00, -1832.21, 0.00, 1832.21),
(4, 4, -1832.21, -2140.55, 0.00, 308.34),
(5, 5, 2100.00, 2608.33, 5200.00, 4691.67),
(6, 6, 2608.33, 1984.10, 5200.00, 5824.23),
(7, 7, 0.00, 0.00, 0.00, 0.00),
(8, 8, 0.00, -1460.98, 0.00, 1460.98);

-- =========================
-- CHAT HISTORY (2 threads each)
-- =========================
INSERT INTO chat_history (chat_id, user_id, title, created_at) VALUES
(1, 1, 'January spending review', '2025-02-02T10:15:00Z'),
(2, 1, 'Help categorize merchants',  '2025-02-10T19:40:00Z'),
(3, 2, 'Budget check-in',            '2025-02-03T13:05:00Z'),
(4, 2, 'Why is cashflow down?',      '2025-02-15T21:22:00Z');

INSERT INTO chat_messages (messages_id, chat_id, speaker_type, message_content, created_at) VALUES
-- Tony chat 1
(1, 1, 'user', 'Can you summarize my January spending and top categories?', '2025-02-02T10:15:10Z'),
(2, 1, 'llm',  'Sure. In January you spent most on Rent, Groceries, and Dining Out. Your discretionary spend was mainly Coffee + Shopping. Want a breakdown by merchant?', '2025-02-02T10:15:18Z'),
(3, 1, 'user', 'Yes—show top merchants and any anomalies.', '2025-02-02T10:16:03Z'),
(4, 1, 'llm',  'Top merchants: Landlord/Rent, Whole Foods/Trader Joe’s, Amazon, Uber/Lyft. Anomalies: a larger-than-usual IKEA/Home Depot run and higher rideshare usage mid-month.', '2025-02-02T10:16:15Z'),

-- Tony chat 2
(5, 2, 'user', 'Merchant "SHELL OIL 1234" should be Gas right?', '2025-02-10T19:40:05Z'),
(6, 2, 'llm',  'Yes—"Shell" and similar fuel merchants typically map to Gas. I’d assign Gas with high confidence (0.9+).', '2025-02-10T19:40:16Z'),
(7, 2, 'user', 'What about "UBER *TRIP"?', '2025-02-10T19:41:02Z'),
(8, 2, 'llm',  'That’s Transportation. If you split categories, it can be Rideshare/Transportation. Confidence ~0.95.', '2025-02-10T19:41:09Z'),

-- Alex chat 3
(9,  3, 'user', 'Am I hitting my savings goal this month?', '2025-02-03T13:05:11Z'),
(10, 3, 'llm',  'Based on your Feb-to-date expenses vs income, you’re slightly below a 10% savings rate. Cutting Dining Out and Shopping by ~15% would put you back on track.', '2025-02-03T13:05:24Z'),

-- Alex chat 4
(11, 4, 'user', 'My cashflow looks worse than January—why?', '2025-02-15T21:22:10Z'),
(12, 4, 'llm',  'Two drivers: higher utilities and a spike in travel-related purchases. Also, fewer income credits posted by mid-month can temporarily lower cashflow.', '2025-02-15T21:22:26Z');

-- =========================
-- TRANSACTIONS
-- Notes:
--  - Checking accounts include Income, Rent, Utilities, Transfers
--  - Credit cards include dining/shopping/subscriptions, with CC payments coming from Checking as Transfers
--  - Some rows intentionally have NULL merchant_id/category_id to test "uncategorized"
--  - category_confidence ranges 0..1
-- =========================

-- Tony (user_id=1) - Chase Checking statement 1 (Jan)
INSERT INTO transactions
(transaction_id, user_id, account_id, statement_id, merchant_id, category_id, category_confidence, transaction_date, description, amount)
VALUES
(1, 1, 1, 1, 1, 1, 0.99, '2025-01-02', 'ACME PAYROLL DIRECT DEP', 3100.00),
(2, 1, 1, 1, 17, 2, 0.98, '2025-01-03', 'RENT PAYMENT', -2100.00),
(3, 1, 1, 1, 14, 8, 0.95, '2025-01-05', 'COMCAST INTERNET', -89.99),
(4, 1, 1, 1, 15, 8, 0.94, '2025-01-06', 'NATIONAL GRID AUTOPAY', -132.40),
(5, 1, 1, 1, 39, 8, 0.92, '2025-01-07', 'T-MOBILE', -75.00),
(6, 1, 1, 1, 2, 15, 0.85, '2025-01-08', 'VENMO TRANSFER TO AMEX', -500.00),
(7, 1, 1, 1, 3, 15, 0.85, '2025-01-10', 'ZELLE FROM ROOMMATE', 650.00),
(8, 1, 1, 1, 16, 8, 0.90, '2025-01-12', 'CITY WATER BILL', -48.22),
(9, 1, 1, 1, 31, 14, 0.90, '2025-01-14', 'GEICO INSURANCE', -115.67),
(10, 1, 1, 1, 30, 15, 0.88, '2025-01-15', 'PAYMENT TO AMEX CARD', -650.00),
(11, 1, 1, 1, NULL, NULL, 0.00, '2025-01-16', 'MISC ONLINE PAYMENT', -23.18),
(12, 1, 1, 1, 1, 1, 0.99, '2025-01-17', 'ACME PAYROLL DIRECT DEP', 3100.00),
(13, 1, 1, 1, 27, 16, 0.78, '2025-01-20', 'HOME DEPOT IMPROVEMENT', -164.32),
(14, 1, 1, 1, 28, 16, 0.78, '2025-01-21', 'IKEA FURNITURE', -299.99),
(15, 1, 1, 1, 2, 15, 0.85, '2025-01-24', 'VENMO TRANSFER', -120.00);

-- Tony (user_id=1) - Amex CC statement 3 (Jan)
INSERT INTO transactions
(transaction_id, user_id, account_id, statement_id, merchant_id, category_id, category_confidence, transaction_date, description, amount)
VALUES
(20, 1, 2, 3, 5, 3, 0.93, '2025-01-03', 'WHOLE FOODS #1022', -86.15),
(21, 1, 2, 3, 6, 3, 0.93, '2025-01-06', 'TRADER JOE''S', -54.27),
(22, 1, 2, 3, 7, 5, 0.96, '2025-01-07', 'STARBUCKS', -6.45),
(23, 1, 2, 3, 25, 5, 0.95, '2025-01-08', 'DUNKIN', -4.12),
(24, 1, 2, 3, 8, 6, 0.97, '2025-01-09', 'UBER *TRIP', -18.70),
(25, 1, 2, 3, 9, 6, 0.97, '2025-01-10', 'LYFT RIDE', -15.22),
(26, 1, 2, 3, 23, 4, 0.92, '2025-01-11', 'CHIPOTLE', -13.89),
(27, 1, 2, 3, 24, 4, 0.92, '2025-01-12', 'SWEETGREEN', -16.40),
(28, 1, 2, 3, 33, 4, 0.85, '2025-01-14', 'LOCAL BISTRO DINNER', -48.33),
(29, 1, 2, 3, 12, 9, 0.98, '2025-01-15', 'NETFLIX.COM', -15.49),
(30, 1, 2, 3, 13, 9, 0.98, '2025-01-15', 'SPOTIFY', -11.99),
(31, 1, 2, 3, 4, 10, 0.88, '2025-01-18', 'AMAZON MARKETPLACE', -72.64),
(32, 1, 2, 3, 19, 10, 0.88, '2025-01-19', 'TARGET', -34.18),
(33, 1, 2, 3, 20, 11, 0.70, '2025-01-20', 'CVS PHARMACY', -18.27),
(34, 1, 2, 3, 35, 11, 0.70, '2025-01-22', 'WALGREENS', -22.41),
(35, 1, 2, 3, 26, 12, 0.95, '2025-01-23', 'PLANET FITNESS', -25.00),
(36, 1, 2, 3, 10, 7, 0.94, '2025-01-24', 'SHELL OIL', -42.10),
(37, 1, 2, 3, 32, 6, 0.75, '2025-01-25', 'PARKING GARAGE', -12.00),
(38, 1, 2, 3, 18, 10, 0.80, '2025-01-26', 'APPLE.COM/BILL', -9.99),
(39, 1, 2, 3, NULL, NULL, 0.00, '2025-01-28', 'UNRECOGNIZED MERCHANT 5831', -27.55);

-- Tony (user_id=1) - Chase Checking statement 2 (Feb)
INSERT INTO transactions
(transaction_id, user_id, account_id, statement_id, merchant_id, category_id, category_confidence, transaction_date, description, amount)
VALUES
(40, 1, 1, 2, 1, 1, 0.99, '2025-02-01', 'ACME PAYROLL DIRECT DEP', 3100.00),
(41, 1, 1, 2, 17, 2, 0.98, '2025-02-03', 'RENT PAYMENT', -2100.00),
(42, 1, 1, 2, 14, 8, 0.95, '2025-02-04', 'COMCAST INTERNET', -89.99),
(43, 1, 1, 2, 15, 8, 0.94, '2025-02-05', 'NATIONAL GRID AUTOPAY', -146.12),
(44, 1, 1, 2, 39, 8, 0.92, '2025-02-06', 'T-MOBILE', -75.00),
(45, 1, 1, 2, 30, 15, 0.88, '2025-02-07', 'PAYMENT TO AMEX CARD', -720.00),
(46, 1, 1, 2, 31, 14, 0.90, '2025-02-14', 'GEICO INSURANCE', -115.67),
(47, 1, 1, 2, 1, 1, 0.99, '2025-02-15', 'ACME PAYROLL DIRECT DEP', 3100.00),
(48, 1, 1, 2, 40, 17, 0.90, '2025-02-16', 'TEXTBOOKS / COURSE MATERIALS', -126.50),
(49, 1, 1, 2, 3, 15, 0.80, '2025-02-18', 'ZELLE TO FRIEND', -85.00),
(50, 1, 1, 2, NULL, NULL, 0.00, '2025-02-22', 'MANUAL CHECK #1021', -60.00);

-- Tony (user_id=1) - Amex CC statement 4 (Feb, "processing")
INSERT INTO transactions
(transaction_id, user_id, account_id, statement_id, merchant_id, category_id, category_confidence, transaction_date, description, amount)
VALUES
(60, 1, 2, 4, 6, 3, 0.93, '2025-02-02', 'TRADER JOE''S', -62.18),
(61, 1, 2, 4, 7, 5, 0.96, '2025-02-03', 'STARBUCKS', -5.95),
(62, 1, 2, 4, 24, 4, 0.92, '2025-02-04', 'SWEETGREEN', -14.65),
(63, 1, 2, 4, 4, 10, 0.88, '2025-02-06', 'AMAZON MARKETPLACE', -119.23),
(64, 1, 2, 4, 8, 6, 0.97, '2025-02-07', 'UBER *TRIP', -22.33),
(65, 1, 2, 4, 12, 9, 0.98, '2025-02-15', 'NETFLIX.COM', -15.49),
(66, 1, 2, 4, 13, 9, 0.98, '2025-02-15', 'SPOTIFY', -11.99),
(67, 1, 2, 4, 25, 5, 0.95, '2025-02-17', 'DUNKIN', -4.89),
(68, 1, 2, 4, 23, 4, 0.92, '2025-02-18', 'CHIPOTLE', -12.51),
(69, 1, 2, 4, 19, 10, 0.88, '2025-02-20', 'TARGET', -58.02),
(70, 1, 2, 4, 11, 7, 0.94, '2025-02-21', 'EXXONMOBIL', -39.77);

-- Alex (user_id=2) - BoA Checking statement 5 (Jan)
INSERT INTO transactions
(transaction_id, user_id, account_id, statement_id, merchant_id, category_id, category_confidence, transaction_date, description, amount)
VALUES
(80, 2, 3, 5, 1, 101, 0.99, '2025-01-03', 'ACME PAYROLL DIRECT DEP', 2600.00),
(81, 2, 3, 5, 17, 102, 0.98, '2025-01-04', 'RENT PAYMENT', -1750.00),
(82, 2, 3, 5, 14, 108, 0.95, '2025-01-06', 'COMCAST INTERNET', -79.99),
(83, 2, 3, 5, 38, 108, 0.92, '2025-01-07', 'EVERSOURCE ELECTRIC', -141.20),
(84, 2, 3, 5, 39, 108, 0.92, '2025-01-08', 'T-MOBILE', -65.00),
(85, 2, 3, 5, 30, 115, 0.88, '2025-01-10', 'PAYMENT TO CAP1 CARD', -540.00),
(86, 2, 3, 5, 3, 115, 0.80, '2025-01-12', 'ZELLE FROM FRIEND', 200.00),
(87, 2, 3, 5, 31, 114, 0.90, '2025-01-15', 'GEICO INSURANCE', -104.55),
(88, 2, 3, 5, 1, 101, 0.99, '2025-01-17', 'ACME PAYROLL DIRECT DEP', 2600.00),
(89, 2, 3, 5, 40, 117, 0.90, '2025-01-22', 'BOOKSTORE PURCHASE', -89.40),
(90, 2, 3, 5, NULL, NULL, 0.00, '2025-01-28', 'ATM WITHDRAWAL', -80.00);

-- Alex (user_id=2) - Capital One CC statement 7 (Jan, failed)
-- Still insert transactions to test behavior when statement is 'failed'
INSERT INTO transactions
(transaction_id, user_id, account_id, statement_id, merchant_id, category_id, category_confidence, transaction_date, description, amount)
VALUES
(100, 2, 4, 7, 6, 103, 0.93, '2025-01-05', 'TRADER JOE''S', -47.12),
(101, 2, 4, 7, 7, 105, 0.96, '2025-01-06', 'STARBUCKS', -6.85),
(102, 2, 4, 7, 24, 104, 0.92, '2025-01-08', 'SWEETGREEN', -15.20),
(103, 2, 4, 7, 4, 110, 0.88, '2025-01-10', 'AMAZON', -66.43),
(104, 2, 4, 7, 12, 109, 0.98, '2025-01-15', 'NETFLIX.COM', -15.49),
(105, 2, 4, 7, 13, 109, 0.98, '2025-01-15', 'SPOTIFY', -11.99),
(106, 2, 4, 7, 9, 106, 0.97, '2025-01-18', 'LYFT RIDE', -14.11),
(107, 2, 4, 7, 10, 107, 0.94, '2025-01-19', 'SHELL OIL', -33.90),
(108, 2, 4, 7, 20, 111, 0.70, '2025-01-20', 'CVS', -12.48),
(109, 2, 4, 7, NULL, NULL, 0.00, '2025-01-27', 'UNKNOWN CHARGE', -19.99);

-- Alex (user_id=2) - BoA Checking statement 6 (Feb)
INSERT INTO transactions
(transaction_id, user_id, account_id, statement_id, merchant_id, category_id, category_confidence, transaction_date, description, amount)
VALUES
(120, 2, 3, 6, 1, 101, 0.99, '2025-02-01', 'ACME PAYROLL DIRECT DEP', 2600.00),
(121, 2, 3, 6, 17, 102, 0.98, '2025-02-03', 'RENT PAYMENT', -1750.00),
(122, 2, 3, 6, 14, 108, 0.95, '2025-02-06', 'COMCAST INTERNET', -79.99),
(123, 2, 3, 6, 38, 108, 0.92, '2025-02-07', 'EVERSOURCE ELECTRIC', -189.80),
(124, 2, 3, 6, 31, 114, 0.90, '2025-02-15', 'GEICO INSURANCE', -104.55),
(125, 2, 3, 6, 1, 101, 0.99, '2025-02-15', 'ACME PAYROLL DIRECT DEP', 2600.00),
(126, 2, 3, 6, 30, 115, 0.88, '2025-02-18', 'PAYMENT TO CAP1 CARD', -620.00),
(127, 2, 3, 6, 22, 113, 0.80, '2025-02-20', 'AIRBNB RESERVATION (DEBIT)', -420.00),
(128, 2, 3, 6, NULL, NULL, 0.00, '2025-02-24', 'MISC TRANSFER OUT', -55.34);

-- Alex (user_id=2) - Capital One CC statement 8 (Feb, complete; travel spike)
INSERT INTO transactions
(transaction_id, user_id, account_id, statement_id, merchant_id, category_id, category_confidence, transaction_date, description, amount)
VALUES
(140, 2, 4, 8, 21, 113, 0.92, '2025-02-08', 'DELTA AIR LINES', -318.40),
(141, 2, 4, 8, 22, 113, 0.92, '2025-02-09', 'AIRBNB', -512.00),
(142, 2, 4, 8, 33, 104, 0.85, '2025-02-10', 'LOCAL BISTRO', -62.55),
(143, 2, 4, 8, 8, 106, 0.97, '2025-02-10', 'UBER *TRIP', -28.10),
(144, 2, 4, 8, 4, 110, 0.88, '2025-02-12', 'AMAZON', -41.77),
(145, 2, 4, 8, 19, 110, 0.88, '2025-02-13', 'TARGET', -73.28),
(146, 2, 4, 8, 7, 105, 0.96, '2025-02-14', 'STARBUCKS', -6.25),
(147, 2, 4, 8, 24, 104, 0.92, '2025-02-15', 'SWEETGREEN', -17.90),
(148, 2, 4, 8, 12, 109, 0.98, '2025-02-15', 'NETFLIX.COM', -15.49),
(149, 2, 4, 8, 13, 109, 0.98, '2025-02-15', 'SPOTIFY', -11.99),
(150, 2, 4, 8, 26, 112, 0.95, '2025-02-16', 'PLANET FITNESS', -25.00),
(151, 2, 4, 8, 10, 107, 0.94, '2025-02-18', 'SHELL OIL', -36.52),
(152, 2, 4, 8, 20, 111, 0.70, '2025-02-20', 'CVS', -18.44),
(153, 2, 4, 8, NULL, NULL, 0.00, '2025-02-22', 'MYSTERY MERCHANT 9921', -24.58);

COMMIT;