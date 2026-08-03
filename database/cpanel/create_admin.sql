-- Optional: create first Filament admin when you have no SSH/Terminal.
-- Run this in phpMyAdmin AFTER importing madfan_schema.sql.
--
-- Login:
--   URL:      https://your-domain.com/admin
--   Email:    admin@your-domain.com
--   Password: ChangeMe123!
--
-- Change the email below, then CHANGE THE PASSWORD immediately after first login.

SET NAMES utf8mb4;

INSERT INTO `users` (
  `email`,
  `password_hash`,
  `auth_provider`,
  `name`,
  `username`,
  `fan_id`,
  `total_points`,
  `current_streak_days`,
  `best_streak_days`,
  `referral_count`,
  `is_staff`,
  `token_version`,
  `created_at`,
  `updated_at`
) VALUES (
  'admin@your-domain.com',
  '$2y$12$iP4n2P.ZfYZa6xPxGSdEL.AjS4E1YvotgWCu8ePfR4Z8VjkdQHARa',
  'password',
  'Site Admin',
  'siteadmin',
  'MF-ADMIN01',
  0,
  0,
  0,
  0,
  0,
  1,
  NOW(),
  NOW()
);

-- Assign super-admin role (role id 1 from madfan_schema.sql seed)
INSERT INTO `model_has_roles` (`role_id`, `model_type`, `model_id`)
SELECT 1, 'App\\Models\\User', `id`
FROM `users`
WHERE `email` = 'admin@your-domain.com'
LIMIT 1;
