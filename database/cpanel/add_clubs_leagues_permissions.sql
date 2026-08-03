-- Add missing Clubs/Leagues permissions (run once in phpMyAdmin).
-- Fixes: There is no permission named `leagues.manage` for guard `web`.

SET NAMES utf8mb4;

INSERT INTO `permissions` (`name`, `guard_name`, `created_at`, `updated_at`)
SELECT 'leagues.manage', 'web', NOW(), NOW()
FROM DUAL 
WHERE NOT EXISTS (
  SELECT 1 FROM `permissions` WHERE `name` = 'leagues.manage' AND `guard_name` = 'web'
);

INSERT INTO `permissions` (`name`, `guard_name`, `created_at`, `updated_at`)
SELECT 'clubs.manage', 'web', NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM `permissions` WHERE `name` = 'clubs.manage' AND `guard_name` = 'web'
);

-- Attach to super-admin, admin, and management roles (by role name).
INSERT IGNORE INTO `role_has_permissions` (`permission_id`, `role_id`)
SELECT p.id, r.id
FROM `permissions` p
CROSS JOIN `roles` r
WHERE p.name IN ('leagues.manage', 'clubs.manage')
  AND p.guard_name = 'web'
  AND r.name IN ('super-admin', 'admin', 'management')
  AND r.guard_name = 'web';

-- Spatie caches permissions; clear Laravel cache after this if you have Terminal:
--   php artisan permission:cache-reset
--   php artisan cache:clear
