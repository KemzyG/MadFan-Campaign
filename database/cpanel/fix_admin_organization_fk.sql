-- Paste into phpMyAdmin → SQL tab (database: madfpwgn_user)
-- Then run: php artisan migrate --force

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `admin_organizations` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `partition_countries` JSON NULL,
  `partition_leagues` JSON NULL,
  `partition_clubs` JSON NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `admin_organizations_slug_unique` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `admin_organization_user` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `admin_organization_id` BIGINT UNSIGNED NOT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `admin_organization_user_org_user_unique` (`admin_organization_id`, `user_id`),
  KEY `admin_organization_user_org_id_index` (`admin_organization_id`),
  KEY `admin_organization_user_user_id_index` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ignore errors if these FKs already exist
ALTER TABLE `admin_organization_user`
  ADD CONSTRAINT `admin_organization_user_admin_organization_id_foreign`
  FOREIGN KEY (`admin_organization_id`) REFERENCES `admin_organizations` (`id`) ON DELETE CASCADE;

ALTER TABLE `admin_organization_user`
  ADD CONSTRAINT `admin_organization_user_user_id_foreign`
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

-- Clean failed partial users column/FK (ignore "Unknown" errors)
ALTER TABLE `users` DROP FOREIGN KEY `users_current_admin_organization_id_foreign`;
ALTER TABLE `users` DROP COLUMN `current_admin_organization_id`;

ALTER TABLE `users`
  ADD COLUMN `current_admin_organization_id` BIGINT UNSIGNED NULL AFTER `token_version`;

ALTER TABLE `users`
  ADD CONSTRAINT `users_current_admin_organization_id_foreign`
  FOREIGN KEY (`current_admin_organization_id`)
  REFERENCES `admin_organizations` (`id`)
  ON DELETE SET NULL;

INSERT IGNORE INTO `migrations` (`migration`, `batch`) VALUES
('2026_07_15_090812_create_admin_organizations_table', 2),
('2026_07_15_090813_create_admin_organization_user_table', 2),
('2026_07_15_090813_add_current_admin_organization_id_to_users_table', 2),
('2026_07_15_090814_create_admin_organization_user_table', 2),
('2026_07_15_090815_add_current_admin_organization_id_to_users_table', 2);

SET FOREIGN_KEY_CHECKS = 1;
