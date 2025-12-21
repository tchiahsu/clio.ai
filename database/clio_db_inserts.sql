SET search_path TO clio;

INSERT INTO users (email, first_name, last_name) VALUES
('tony@example.com', 'Tony', 'Hsu'),
('alex@example.com', 'Alex', 'Rivera');

INSERT INTO accounts (user_id, bank_name, account_type) VALUES
(1, 'Chase', 'Checking'),
(1, 'Chase', 'Credit Card'),
(2, 'Bank of America', 'Checking');

INSERT INTO statements (
  user_id,
  account_id,
  period_start,
  period_end,
  file_name,
  current_status
) VALUES
(1, 1, '2025-01-01', '2025-01-31', 'chase_checking_jan_2025.pdf', 'complete'),
(1, 2, '2025-01-01', '2025-01-31', 'chase_cc_jan_2025.pdf', 'complete'),
(2, 3, '2025-01-01', '2025-01-31', 'bofa_checking_jan_2025.pdf', 'processing');

INSERT INTO merchants (merchant_name) VALUES
('Starbucks'),
('Amazon'),
('Uber'),
('Whole Foods'),
('Spotify'),
('Apple');

INSERT INTO categories (user_id, category_name) VALUES
(1, 'Groceries'),
(1, 'Dining Out'),
(1, 'Transportation'),
(1, 'Subscriptions'),
(2, 'Groceries'),
(2, 'Rent');

INSERT INTO statement_summary (
  statement_id,
  starting_balance,
  ending_balance,
  total_income,
  total_expenses
) VALUES
(1, 2500.00, 3100.00, 4200.00, 3600.00),
(2, 0.00, -820.50, 0.00, 820.50);

INSERT INTO chat_history (user_id, title) VALUES
(1, 'January Spending Review'),
(1, 'How much did I spend on food?'),
(2, 'Budget Help');

INSERT INTO chat_messages (
  chat_id,
  speaker_type,
  message_content
) VALUES
(1, 'user', 'Can you summarize my January spending?'),
(1, 'llm', 'You spent the most on groceries and dining out in January.'),
(2, 'user', 'How much did I spend on food last month?'),
(2, 'llm', 'You spent approximately $620 on food-related purchases.'),
(3, 'user', 'Help me create a monthly budget.');

INSERT INTO transactions (
  user_id,
  account_id,
  statement_id,
  merchant_id,
  category_id,
  category_confidence,
  transaction_date,
  description,
  amount
) VALUES
-- Tony – Checking
(1, 1, 1, 4, 1, 0.98, '2025-01-05', 'Whole Foods Market', -145.32),
(1, 1, 1, 1, 2, 0.92, '2025-01-08', 'Starbucks Coffee', -6.45),
(1, 1, 1, 3, 3, 0.95, '2025-01-10', 'Uber Trip', -18.60),

-- Tony – Credit Card
(1, 2, 2, 2, 2, 0.90, '2025-01-12', 'Amazon Purchase', -230.99),
(1, 2, 2, 5, 4, 0.99, '2025-01-15', 'Spotify Subscription', -10.99),
(1, 2, 2, 6, 4, 0.97, '2025-01-20', 'Apple iCloud+', -2.99),

-- Alex – Checking
(2, 3, 3, 4, 5, 0.96, '2025-01-07', 'Whole Foods', -120.10),
(2, 3, 3, NULL, 6, 0.85, '2025-01-01', 'January Rent', -1800.00);
