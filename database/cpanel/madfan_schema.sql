-- MadFan MySQL dump for cPanel / phpMyAdmin
-- Generated: 2026-07-15 05:15:11
-- Import into an empty database created in cPanel → MySQL® Databases

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
SET time_zone = '+00:00';

DROP TABLE IF EXISTS `activity_logs`;
CREATE TABLE `activity_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NULL,
  `event` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `properties` JSON NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` TEXT NULL,
  `created_at` DATETIME NULL,
  `updated_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `activity_logs_fk_0_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  KEY `activity_logs_event_index` (`event`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `cache`;
CREATE TABLE `cache` (
  `key` VARCHAR(255) NOT NULL,
  `value` TEXT NOT NULL,
  `expiration` INT NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `cache_locks`;
CREATE TABLE `cache_locks` (
  `key` VARCHAR(255) NOT NULL,
  `owner` VARCHAR(255) NOT NULL,
  `expiration` INT NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_locks_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `daily_claims`;
CREATE TABLE `daily_claims` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `season_id` BIGINT UNSIGNED NULL,
  `claim_date` DATE NOT NULL,
  `status` VARCHAR(255) NOT NULL DEFAULT 'upcoming',
  `base_points` INT NOT NULL,
  `multiplier` DECIMAL(8,2) NOT NULL DEFAULT '1',
  `points_earned` INT NOT NULL DEFAULT '0',
  `streak_day_number` INT NOT NULL DEFAULT '0',
  `claimed_at` DATETIME NULL,
  `point_transaction_id` BIGINT UNSIGNED NULL,
  `created_at` DATETIME NULL,
  `updated_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `daily_claims_fk_0_point_transaction_id` FOREIGN KEY (`point_transaction_id`) REFERENCES `point_transactions` (`id`) ON DELETE SET NULL ON UPDATE NO ACTION,
  CONSTRAINT `daily_claims_fk_1_season_id` FOREIGN KEY (`season_id`) REFERENCES `seasons` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `daily_claims_fk_2_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  KEY `daily_claims_season_id_claim_date_index` (`season_id`, `claim_date`),
  UNIQUE KEY `daily_claims_user_id_claim_date_unique` (`user_id`, `claim_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `device_tokens`;
CREATE TABLE `device_tokens` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `token` VARCHAR(512) NOT NULL,
  `platform` VARCHAR(32) NOT NULL,
  `last_registered_at` DATETIME NOT NULL,
  `revoked_at` DATETIME NULL,
  `created_at` DATETIME NULL,
  `updated_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `device_tokens_fk_0_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  UNIQUE KEY `device_tokens_token_unique` (`token`),
  KEY `device_tokens_revoked_at_index` (`revoked_at`),
  KEY `device_tokens_user_id_platform_index` (`user_id`, `platform`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `earn_sources`;
CREATE TABLE `earn_sources` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `season_id` BIGINT UNSIGNED NULL,
  `name` VARCHAR(255) NOT NULL,
  `points_min` INT NULL,
  `points_max` INT NULL,
  `points_label` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `display_order` INT NOT NULL,
  `created_at` DATETIME NULL,
  `updated_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `earn_sources_fk_0_season_id` FOREIGN KEY (`season_id`) REFERENCES `seasons` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `failed_jobs`;
CREATE TABLE `failed_jobs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `uuid` CHAR(36) NOT NULL,
  `connection` VARCHAR(255) NOT NULL,
  `queue` VARCHAR(255) NOT NULL,
  `payload` LONGTEXT NOT NULL,
  `exception` LONGTEXT NOT NULL,
  `failed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`),
  KEY `failed_jobs_connection_queue_failed_at_index` (`connection`, `queue`, `failed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `idempotency_keys`;
CREATE TABLE `idempotency_keys` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `key` VARCHAR(255) NOT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `route_name` VARCHAR(255) NOT NULL,
  `created_at` DATETIME NULL,
  `updated_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `idempotency_keys_fk_0_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  UNIQUE KEY `idempotency_keys_key_unique` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `job_batches`;
CREATE TABLE `job_batches` (
  `id` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `total_jobs` INT NOT NULL,
  `pending_jobs` INT NOT NULL,
  `failed_jobs` INT NOT NULL,
  `failed_job_ids` TEXT NOT NULL,
  `options` TEXT NULL,
  `cancelled_at` INT NULL,
  `created_at` INT NOT NULL,
  `finished_at` INT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `jobs`;
CREATE TABLE `jobs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `queue` VARCHAR(255) NOT NULL,
  `payload` LONGTEXT NOT NULL,
  `attempts` INT NOT NULL,
  `reserved_at` INT NULL,
  `available_at` INT NOT NULL,
  `created_at` INT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `leaderboard_entries`;
CREATE TABLE `leaderboard_entries` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `leaderboard_snapshot_id` BIGINT UNSIGNED NOT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `rank` INT NOT NULL,
  `points` INT NOT NULL,
  `loyalty_tier_id` BIGINT UNSIGNED NULL,
  `created_at` DATETIME NULL,
  `updated_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `leaderboard_entries_fk_0_loyalty_tier_id` FOREIGN KEY (`loyalty_tier_id`) REFERENCES `loyalty_tiers` (`id`) ON DELETE SET NULL ON UPDATE NO ACTION,
  CONSTRAINT `leaderboard_entries_fk_1_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `leaderboard_entries_fk_2_leaderboard_snapshot_id` FOREIGN KEY (`leaderboard_snapshot_id`) REFERENCES `leaderboard_snapshots` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  KEY `leaderboard_entries_user_id_index` (`user_id`),
  UNIQUE KEY `leaderboard_entries_leaderboard_snapshot_id_rank_unique` (`leaderboard_snapshot_id`, `rank`),
  UNIQUE KEY `leaderboard_entries_leaderboard_snapshot_id_user_id_unique` (`leaderboard_snapshot_id`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `leaderboard_snapshots`;
CREATE TABLE `leaderboard_snapshots` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `season_id` BIGINT UNSIGNED NOT NULL,
  `snapshot_at` DATETIME NOT NULL,
  `scope` VARCHAR(255) NOT NULL,
  `scope_value` VARCHAR(255) NULL,
  `created_at` DATETIME NULL,
  `updated_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `leaderboard_snapshots_fk_0_season_id` FOREIGN KEY (`season_id`) REFERENCES `seasons` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `loyalty_tiers`;
CREATE TABLE `loyalty_tiers` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `min_points` INT NOT NULL,
  `max_points` INT NULL,
  `display_order` INT NOT NULL,
  `created_at` DATETIME NULL,
  `updated_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `loyalty_tiers_code_unique` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `migrations`;
CREATE TABLE `migrations` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `migration` VARCHAR(255) NOT NULL,
  `batch` INT NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `model_has_permissions`;
CREATE TABLE `model_has_permissions` (
  `permission_id` BIGINT UNSIGNED NOT NULL,
  `model_type` VARCHAR(255) NOT NULL,
  `model_id` BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`permission_id`, `model_id`, `model_type`),
  CONSTRAINT `model_has_permissions_fk_0_permission_id` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  KEY `model_has_permissions_model_id_model_type_index` (`model_id`, `model_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `model_has_roles`;
CREATE TABLE `model_has_roles` (
  `role_id` BIGINT UNSIGNED NOT NULL,
  `model_type` VARCHAR(255) NOT NULL,
  `model_id` BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`role_id`, `model_id`, `model_type`),
  CONSTRAINT `model_has_roles_fk_0_role_id` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  KEY `model_has_roles_model_id_model_type_index` (`model_id`, `model_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `passports`;
CREATE TABLE `passports` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `season_id` BIGINT UNSIGNED NOT NULL,
  `qr_value` VARCHAR(255) NOT NULL,
  `referral_link` VARCHAR(255) NOT NULL,
  `share_slug` VARCHAR(255) NOT NULL,
  `is_public` TINYINT(1) NOT NULL DEFAULT '0',
  `last_shared_at` DATETIME NULL,
  `snapshot_name` VARCHAR(255) NULL,
  `snapshot_handle` VARCHAR(255) NULL,
  `snapshot_club` VARCHAR(255) NULL,
  `snapshot_tier` VARCHAR(255) NULL,
  `snapshot_points` INT NULL,
  `snapshot_streak_days` INT NULL,
  `snapshot_referral_count` INT NULL,
  `created_at` DATETIME NULL,
  `updated_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `passports_fk_0_season_id` FOREIGN KEY (`season_id`) REFERENCES `seasons` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `passports_fk_1_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  UNIQUE KEY `passports_share_slug_unique` (`share_slug`),
  UNIQUE KEY `passports_user_id_unique` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `password_reset_tokens`;
CREATE TABLE `password_reset_tokens` (
  `email` VARCHAR(255) NOT NULL,
  `token` VARCHAR(255) NOT NULL,
  `created_at` DATETIME NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `permissions`;
CREATE TABLE `permissions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `guard_name` VARCHAR(255) NOT NULL,
  `created_at` DATETIME NULL,
  `updated_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `permissions_name_guard_name_unique` (`name`, `guard_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `personal_access_tokens`;
CREATE TABLE `personal_access_tokens` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tokenable_type` VARCHAR(255) NOT NULL,
  `tokenable_id` BIGINT UNSIGNED NOT NULL,
  `name` TEXT NOT NULL,
  `token` VARCHAR(255) NOT NULL,
  `abilities` TEXT NULL,
  `last_used_at` DATETIME NULL,
  `expires_at` DATETIME NULL,
  `created_at` DATETIME NULL,
  `updated_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  KEY `personal_access_tokens_expires_at_index` (`expires_at`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`, `tokenable_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `point_transactions`;
CREATE TABLE `point_transactions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `season_id` BIGINT UNSIGNED NULL,
  `source_type` VARCHAR(255) NOT NULL,
  `source_id` VARCHAR(255) NULL,
  `amount` INT NOT NULL,
  `balance_after` INT NOT NULL,
  `reason` VARCHAR(255) NOT NULL,
  `metadata` JSON NULL,
  `idempotency_key` VARCHAR(255) NULL,
  `created_at` DATETIME NULL,
  `updated_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `point_transactions_fk_0_season_id` FOREIGN KEY (`season_id`) REFERENCES `seasons` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `point_transactions_fk_1_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  UNIQUE KEY `point_transactions_idempotency_key_unique` (`idempotency_key`),
  KEY `point_transactions_source_type_source_id_index` (`source_type`, `source_id`),
  KEY `point_transactions_season_id_index` (`season_id`),
  KEY `point_transactions_user_id_created_at_index` (`user_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `referral_milestones`;
CREATE TABLE `referral_milestones` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `season_id` BIGINT UNSIGNED NULL,
  `target_count` INT NOT NULL,
  `reward_name` VARCHAR(255) NOT NULL,
  `reward_description` TEXT NOT NULL,
  `bonus_points` INT NULL,
  `display_order` INT NOT NULL,
  `created_at` DATETIME NULL,
  `updated_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `referral_milestones_fk_0_season_id` FOREIGN KEY (`season_id`) REFERENCES `seasons` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `referrals`;
CREATE TABLE `referrals` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `referrer_user_id` BIGINT UNSIGNED NOT NULL,
  `referred_user_id` BIGINT UNSIGNED NULL,
  `referred_email` VARCHAR(255) NULL,
  `referred_user_handle` VARCHAR(255) NULL,
  `referral_code` VARCHAR(255) NOT NULL,
  `status` VARCHAR(255) NOT NULL DEFAULT 'pending',
  `points_awarded` INT NOT NULL DEFAULT '0',
  `point_transaction_id` BIGINT UNSIGNED NULL,
  `activated_at` DATETIME NULL,
  `rewarded_at` DATETIME NULL,
  `created_at` DATETIME NULL,
  `updated_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `referrals_fk_0_point_transaction_id` FOREIGN KEY (`point_transaction_id`) REFERENCES `point_transactions` (`id`) ON DELETE SET NULL ON UPDATE NO ACTION,
  CONSTRAINT `referrals_fk_1_referred_user_id` FOREIGN KEY (`referred_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE NO ACTION,
  CONSTRAINT `referrals_fk_2_referrer_user_id` FOREIGN KEY (`referrer_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  UNIQUE KEY `referrals_referrer_user_id_referred_user_id_unique` (`referrer_user_id`, `referred_user_id`),
  KEY `referrals_referral_code_index` (`referral_code`),
  KEY `referrals_referred_user_id_index` (`referred_user_id`),
  KEY `referrals_referrer_user_id_index` (`referrer_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `role_has_permissions`;
CREATE TABLE `role_has_permissions` (
  `permission_id` BIGINT UNSIGNED NOT NULL,
  `role_id` BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`permission_id`, `role_id`),
  CONSTRAINT `role_has_permissions_fk_0_role_id` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `role_has_permissions_fk_1_permission_id` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `guard_name` VARCHAR(255) NOT NULL,
  `created_at` DATETIME NULL,
  `updated_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `roles_name_guard_name_unique` (`name`, `guard_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `season_claim_histories`;
CREATE TABLE `season_claim_histories` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `season_id` BIGINT UNSIGNED NOT NULL,
  `week_number` INT NOT NULL,
  `claim_date` DATE NOT NULL,
  `status` VARCHAR(255) NOT NULL,
  `created_at` DATETIME NULL,
  `updated_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `season_claim_histories_fk_0_season_id` FOREIGN KEY (`season_id`) REFERENCES `seasons` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `season_claim_histories_fk_1_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  KEY `season_claim_histories_season_id_week_number_index` (`season_id`, `week_number`),
  UNIQUE KEY `season_claim_histories_user_id_claim_date_unique` (`user_id`, `claim_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `season_weeks`;
CREATE TABLE `season_weeks` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `season_id` BIGINT UNSIGNED NOT NULL,
  `week_number` INT NOT NULL,
  `code` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `starts_at` DATETIME NOT NULL,
  `ends_at` DATETIME NOT NULL,
  `point_multiplier` DECIMAL(8,2) NOT NULL,
  `completion_bonus_points` INT NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT '1',
  `created_at` DATETIME NULL,
  `updated_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `season_weeks_fk_0_season_id` FOREIGN KEY (`season_id`) REFERENCES `seasons` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  KEY `season_weeks_is_active_index` (`is_active`),
  UNIQUE KEY `season_weeks_season_id_week_number_unique` (`season_id`, `week_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `seasons`;
CREATE TABLE `seasons` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `status` VARCHAR(255) NOT NULL,
  `starts_at` DATETIME NOT NULL,
  `ends_at` DATETIME NOT NULL,
  `total_weeks` INT NOT NULL,
  `points_budget` INT NULL,
  `created_at` DATETIME NULL,
  `updated_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `seasons_code_unique` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `sessions`;
CREATE TABLE `sessions` (
  `id` VARCHAR(255) NOT NULL,
  `user_id` BIGINT UNSIGNED NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` TEXT NULL,
  `payload` LONGTEXT NOT NULL,
  `last_activity` INT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_last_activity_index` (`last_activity`),
  KEY `sessions_user_id_index` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `settings`;
CREATE TABLE `settings` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `key` VARCHAR(255) NOT NULL,
  `value` TEXT NULL,
  `description` VARCHAR(255) NULL,
  `type` VARCHAR(50) NOT NULL DEFAULT 'text',
  `created_at` DATETIME NULL,
  `updated_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `settings_key_unique` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `social_accounts`;
CREATE TABLE `social_accounts` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `platform` VARCHAR(32) NOT NULL,
  `platform_user_id` VARCHAR(255) NOT NULL,
  `username` VARCHAR(255) NULL,
  `display_name` VARCHAR(255) NULL,
  `metadata` JSON NULL,
  `connected_at` DATETIME NOT NULL,
  `verified_at` DATETIME NULL,
  `created_at` DATETIME NULL,
  `updated_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `social_accounts_fk_0_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  KEY `social_accounts_platform_username_index` (`platform`, `username`),
  UNIQUE KEY `social_accounts_platform_platform_user_id_unique` (`platform`, `platform_user_id`),
  UNIQUE KEY `social_accounts_user_id_platform_unique` (`user_id`, `platform`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `streak_milestones`;
CREATE TABLE `streak_milestones` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `season_id` BIGINT UNSIGNED NULL,
  `day_count` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `bonus_points` INT NOT NULL,
  `multiplier` DECIMAL(8,2) NOT NULL,
  `description` TEXT NOT NULL,
  `created_at` DATETIME NULL,
  `updated_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `streak_milestones_fk_0_season_id` FOREIGN KEY (`season_id`) REFERENCES `seasons` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `streaks`;
CREATE TABLE `streaks` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `current_streak_days` INT NOT NULL DEFAULT '0',
  `best_streak_days` INT NOT NULL DEFAULT '0',
  `last_claimed_at` DATETIME NULL,
  `next_claim_reset_at` DATETIME NULL,
  `current_multiplier` DECIMAL(8,2) NOT NULL DEFAULT '1',
  `current_milestone_label` VARCHAR(255) NULL,
  `created_at` DATETIME NULL,
  `updated_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `streaks_fk_0_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  UNIQUE KEY `streaks_user_id_unique` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `task_steps`;
CREATE TABLE `task_steps` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `task_id` BIGINT UNSIGNED NOT NULL,
  `step_number` INT NOT NULL,
  `description` TEXT NOT NULL,
  `link_url` VARCHAR(255) NULL,
  `link_label` VARCHAR(255) NULL,
  `created_at` DATETIME NULL,
  `updated_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `task_steps_fk_0_task_id` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  UNIQUE KEY `task_steps_task_id_step_number_unique` (`task_id`, `step_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `tasks`;
CREATE TABLE `tasks` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `season_id` BIGINT UNSIGNED NULL,
  `season_week_id` BIGINT UNSIGNED NULL,
  `code` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `points` INT NOT NULL,
  `platform` VARCHAR(32) NOT NULL,
  `task_type` VARCHAR(255) NOT NULL,
  `external_url` VARCHAR(255) NULL,
  `verification_required` TINYINT(1) NOT NULL DEFAULT '0',
  `is_active` TINYINT(1) NOT NULL DEFAULT '1',
  `display_order` INT NOT NULL,
  `starts_at` DATETIME NULL,
  `ends_at` DATETIME NULL,
  `created_at` DATETIME NULL,
  `updated_at` DATETIME NULL,
  `audience` VARCHAR(255) NOT NULL DEFAULT 'fan',
  `staff_position` VARCHAR(255) NULL,
  `assigned_user_id` BIGINT UNSIGNED NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `tasks_fk_0_assigned_user_id` FOREIGN KEY (`assigned_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE NO ACTION,
  CONSTRAINT `tasks_fk_1_season_id` FOREIGN KEY (`season_id`) REFERENCES `seasons` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `tasks_fk_2_season_week_id` FOREIGN KEY (`season_week_id`) REFERENCES `season_weeks` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  KEY `tasks_season_id_season_week_id_index` (`season_id`, `season_week_id`),
  KEY `tasks_is_active_display_order_index` (`is_active`, `display_order`),
  UNIQUE KEY `tasks_code_unique` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `tier_rewards`;
CREATE TABLE `tier_rewards` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `loyalty_tier_id` BIGINT UNSIGNED NOT NULL,
  `reward_text` VARCHAR(255) NOT NULL,
  `display_order` INT NOT NULL,
  `created_at` DATETIME NULL,
  `updated_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `tier_rewards_fk_0_loyalty_tier_id` FOREIGN KEY (`loyalty_tier_id`) REFERENCES `loyalty_tiers` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `user_referral_milestones`;
CREATE TABLE `user_referral_milestones` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `referral_milestone_id` BIGINT UNSIGNED NOT NULL,
  `status` VARCHAR(255) NOT NULL DEFAULT 'locked',
  `progress_count` INT NOT NULL DEFAULT '0',
  `completed_at` DATETIME NULL,
  `point_transaction_id` BIGINT UNSIGNED NULL,
  `created_at` DATETIME NULL,
  `updated_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `user_referral_milestones_fk_0_point_transaction_id` FOREIGN KEY (`point_transaction_id`) REFERENCES `point_transactions` (`id`) ON DELETE SET NULL ON UPDATE NO ACTION,
  CONSTRAINT `user_referral_milestones_fk_1_referral_milestone_id` FOREIGN KEY (`referral_milestone_id`) REFERENCES `referral_milestones` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `user_referral_milestones_fk_2_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  UNIQUE KEY `user_referral_milestones_user_id_referral_milestone_id_unique` (`user_id`, `referral_milestone_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `user_task_progress`;
CREATE TABLE `user_task_progress` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `task_id` BIGINT UNSIGNED NOT NULL,
  `season_id` BIGINT UNSIGNED NULL,
  `season_week_id` BIGINT UNSIGNED NULL,
  `status` VARCHAR(255) NOT NULL DEFAULT 'pending',
  `is_checked` TINYINT(1) NOT NULL DEFAULT '0',
  `verification_status` VARCHAR(255) NOT NULL DEFAULT 'not_required',
  `proof_url` VARCHAR(255) NULL,
  `external_handle` VARCHAR(255) NULL,
  `external_post_id` VARCHAR(255) NULL,
  `verification_payload` TEXT NULL,
  `confirmed_at` DATETIME NULL,
  `verified_at` DATETIME NULL,
  `claimed_at` DATETIME NULL,
  `failed_at` DATETIME NULL,
  `failure_reason` TEXT NULL,
  `points_awarded` INT NOT NULL DEFAULT '0',
  `point_transaction_id` BIGINT UNSIGNED NULL,
  `created_at` DATETIME NULL,
  `updated_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `user_task_progress_fk_0_point_transaction_id` FOREIGN KEY (`point_transaction_id`) REFERENCES `point_transactions` (`id`) ON DELETE SET NULL ON UPDATE NO ACTION,
  CONSTRAINT `user_task_progress_fk_1_season_week_id` FOREIGN KEY (`season_week_id`) REFERENCES `season_weeks` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `user_task_progress_fk_2_season_id` FOREIGN KEY (`season_id`) REFERENCES `seasons` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `user_task_progress_fk_3_task_id` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `user_task_progress_fk_4_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  KEY `user_task_progress_verification_status_index` (`verification_status`),
  KEY `user_task_progress_season_id_season_week_id_index` (`season_id`, `season_week_id`),
  KEY `user_task_progress_user_id_status_index` (`user_id`, `status`),
  UNIQUE KEY `user_task_progress_user_id_task_id_unique` (`user_id`, `task_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(255) NULL,
  `password_hash` VARCHAR(255) NULL,
  `firebase_uid` VARCHAR(255) NULL,
  `auth_provider` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `username` VARCHAR(255) NOT NULL,
  `handle` VARCHAR(255) NULL,
  `fan_id` VARCHAR(255) NOT NULL,
  `country` VARCHAR(255) NULL,
  `league` VARCHAR(255) NULL,
  `club` VARCHAR(255) NULL,
  `avatar_emoji` VARCHAR(255) NULL,
  `loyalty_tier_id` BIGINT UNSIGNED NULL,
  `total_points` INT NOT NULL DEFAULT '0',
  `current_streak_days` INT NOT NULL DEFAULT '0',
  `best_streak_days` INT NOT NULL DEFAULT '0',
  `referral_count` INT NOT NULL DEFAULT '0',
  `email_verified_at` DATETIME NULL,
  `last_login_at` DATETIME NULL,
  `remember_token` VARCHAR(100) NULL,
  `created_at` DATETIME NULL,
  `updated_at` DATETIME NULL,
  `is_staff` TINYINT(1) NOT NULL DEFAULT '0',
  `staff_position` VARCHAR(255) NULL,
  `staff_position_assigned_at` DATETIME NULL,
  `staff_position_assigned_by` BIGINT UNSIGNED NULL,
  `staff_status` VARCHAR(255) NULL,
  `token_version` INT NOT NULL DEFAULT '1',
  `avatar_path` VARCHAR(255) NULL,
  `shootout_window_earned` INT NOT NULL DEFAULT '0',
  `shootout_cooldown_until` DATETIME NULL,
  `shootout_last_awarded_at` DATETIME NULL,
  `shootout_losses_today` INT NOT NULL DEFAULT '0',
  `shootout_stats_date` DATE NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `users_fk_0_staff_position_assigned_by` FOREIGN KEY (`staff_position_assigned_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE NO ACTION,
  CONSTRAINT `users_fk_1_loyalty_tier_id` FOREIGN KEY (`loyalty_tier_id`) REFERENCES `loyalty_tiers` (`id`) ON DELETE SET NULL ON UPDATE NO ACTION,
  UNIQUE KEY `users_username_unique` (`username`),
  KEY `users_total_points_index` (`total_points`),
  KEY `users_loyalty_tier_id_index` (`loyalty_tier_id`),
  UNIQUE KEY `users_firebase_uid_unique` (`firebase_uid`),
  UNIQUE KEY `users_fan_id_unique` (`fan_id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `waitlists`;
CREATE TABLE `waitlists` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `full_name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `country` VARCHAR(255) NOT NULL,
  `league` VARCHAR(255) NULL,
  `club` VARCHAR(255) NOT NULL,
  `source` VARCHAR(255) NULL,
  `user_id` BIGINT UNSIGNED NULL,
  `created_at` DATETIME NULL,
  `updated_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `waitlists_fk_0_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE NO ACTION,
  UNIQUE KEY `waitlists_email_unique` (`email`),
  KEY `waitlists_created_at_index` (`created_at`),
  KEY `waitlists_club_index` (`club`),
  KEY `waitlists_country_index` (`country`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `weekly_progress`;
CREATE TABLE `weekly_progress` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `season_id` BIGINT UNSIGNED NOT NULL,
  `season_week_id` BIGINT UNSIGNED NOT NULL,
  `tasks_done` INT NOT NULL DEFAULT '0',
  `tasks_total` INT NOT NULL DEFAULT '0',
  `completion_bonus_awarded` TINYINT(1) NOT NULL DEFAULT '0',
  `completion_bonus_points` INT NOT NULL DEFAULT '0',
  `completion_bonus_transaction_id` BIGINT UNSIGNED NULL,
  `created_at` DATETIME NULL,
  `updated_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `weekly_progress_fk_0_completion_bonus_transaction_id` FOREIGN KEY (`completion_bonus_transaction_id`) REFERENCES `point_transactions` (`id`) ON DELETE SET NULL ON UPDATE NO ACTION,
  CONSTRAINT `weekly_progress_fk_1_season_week_id` FOREIGN KEY (`season_week_id`) REFERENCES `season_weeks` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `weekly_progress_fk_2_season_id` FOREIGN KEY (`season_id`) REFERENCES `seasons` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `weekly_progress_fk_3_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  UNIQUE KEY `weekly_progress_user_id_season_week_id_unique` (`user_id`, `season_week_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed data

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (1, '0001_01_01_000000_create_users_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (2, '0001_01_01_000001_create_cache_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (3, '0001_01_01_000002_create_jobs_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (4, '2026_06_16_160404_create_personal_access_tokens_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (5, '2026_06_16_160502_create_device_tokens_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (6, '2026_06_16_160511_create_seasons_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (7, '2026_06_16_160512_create_earn_sources_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (8, '2026_06_16_160512_create_season_weeks_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (9, '2026_06_16_160522_create_loyalty_tiers_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (10, '2026_06_16_160522_create_passports_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (11, '2026_06_16_160522_create_tier_rewards_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (12, '2026_06_16_160523_create_point_transactions_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (13, '2026_06_16_160532_create_tasks_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (14, '2026_06_16_160534_create_task_steps_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (15, '2026_06_16_160535_create_user_task_progress_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (16, '2026_06_16_160536_create_weekly_progress_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (17, '2026_06_16_160539_create_daily_claims_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (18, '2026_06_16_160540_create_streak_milestones_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (19, '2026_06_16_160540_create_streaks_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (20, '2026_06_16_160541_create_season_claim_histories_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (21, '2026_06_16_160547_create_referrals_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (22, '2026_06_16_160548_create_referral_milestones_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (23, '2026_06_16_160549_create_user_referral_milestones_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (24, '2026_06_16_160600_create_leaderboard_snapshots_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (25, '2026_06_16_160601_create_leaderboard_entries_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (26, '2026_06_16_161748_create_waitlists_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (27, '2026_06_19_154642_create_permission_tables', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (28, '2026_06_20_160700_create_idempotency_keys_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (29, '2026_06_20_175415_create_settings_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (30, '2026_06_20_175652_create_activity_logs_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (31, '2026_06_24_230405_create_social_accounts_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (32, '2026_06_25_023403_add_staff_position_fields_to_users_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (33, '2026_06_25_023405_add_staff_assignment_fields_to_tasks_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (34, '2026_06_25_041126_add_token_version_to_users_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (35, '2026_07_12_150436_add_avatar_path_to_users_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (36, '2026_07_12_173554_add_penalty_shootout_to_point_transactions_source_type', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (37, '2026_07_12_181846_add_shootout_cooldown_columns_to_users_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (38, '2026_07_12_184653_add_shootout_last_awarded_at_to_users_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (39, '2026_07_12_201808_add_shootout_day_stats_to_users_table', 1);
INSERT INTO `loyalty_tiers` (`id`, `code`, `name`, `min_points`, `max_points`, `display_order`, `created_at`, `updated_at`) VALUES (1, 'CORE_FAN', 'CORE FAN', 0, 999, 1, '2026-07-15 05:15:09', '2026-07-15 05:15:09');
INSERT INTO `loyalty_tiers` (`id`, `code`, `name`, `min_points`, `max_points`, `display_order`, `created_at`, `updated_at`) VALUES (2, 'ULTRA_FAN', 'ULTRA FAN', 1000, 4999, 2, '2026-07-15 05:15:09', '2026-07-15 05:15:09');
INSERT INTO `loyalty_tiers` (`id`, `code`, `name`, `min_points`, `max_points`, `display_order`, `created_at`, `updated_at`) VALUES (3, 'LEGEND_FAN', 'LEGEND FAN', 5000, NULL, 3, '2026-07-15 05:15:09', '2026-07-15 05:15:09');
INSERT INTO `tier_rewards` (`id`, `loyalty_tier_id`, `reward_text`, `display_order`, `created_at`, `updated_at`) VALUES (1, 1, 'Daily claim access', 1, '2026-07-15 05:15:09', '2026-07-15 05:15:09');
INSERT INTO `tier_rewards` (`id`, `loyalty_tier_id`, `reward_text`, `display_order`, `created_at`, `updated_at`) VALUES (2, 1, 'Basic task participation', 2, '2026-07-15 05:15:09', '2026-07-15 05:15:09');
INSERT INTO `tier_rewards` (`id`, `loyalty_tier_id`, `reward_text`, `display_order`, `created_at`, `updated_at`) VALUES (3, 1, 'Community badge', 3, '2026-07-15 05:15:09', '2026-07-15 05:15:09');
INSERT INTO `tier_rewards` (`id`, `loyalty_tier_id`, `reward_text`, `display_order`, `created_at`, `updated_at`) VALUES (4, 2, '2x bonus on daily claims', 1, '2026-07-15 05:15:09', '2026-07-15 05:15:09');
INSERT INTO `tier_rewards` (`id`, `loyalty_tier_id`, `reward_text`, `display_order`, `created_at`, `updated_at`) VALUES (5, 2, 'Exclusive tasks', 2, '2026-07-15 05:15:09', '2026-07-15 05:15:09');
INSERT INTO `tier_rewards` (`id`, `loyalty_tier_id`, `reward_text`, `display_order`, `created_at`, `updated_at`) VALUES (6, 2, 'Priority support', 3, '2026-07-15 05:15:09', '2026-07-15 05:15:09');
INSERT INTO `tier_rewards` (`id`, `loyalty_tier_id`, `reward_text`, `display_order`, `created_at`, `updated_at`) VALUES (7, 2, 'Ultra Fan badge', 4, '2026-07-15 05:15:09', '2026-07-15 05:15:09');
INSERT INTO `tier_rewards` (`id`, `loyalty_tier_id`, `reward_text`, `display_order`, `created_at`, `updated_at`) VALUES (8, 3, '3x bonus on daily claims', 1, '2026-07-15 05:15:09', '2026-07-15 05:15:09');
INSERT INTO `tier_rewards` (`id`, `loyalty_tier_id`, `reward_text`, `display_order`, `created_at`, `updated_at`) VALUES (9, 3, 'VIP-only events', 2, '2026-07-15 05:15:10', '2026-07-15 05:15:10');
INSERT INTO `tier_rewards` (`id`, `loyalty_tier_id`, `reward_text`, `display_order`, `created_at`, `updated_at`) VALUES (10, 3, 'Special merchandise', 3, '2026-07-15 05:15:10', '2026-07-15 05:15:10');
INSERT INTO `tier_rewards` (`id`, `loyalty_tier_id`, `reward_text`, `display_order`, `created_at`, `updated_at`) VALUES (11, 3, 'Direct community access', 4, '2026-07-15 05:15:10', '2026-07-15 05:15:10');
INSERT INTO `tier_rewards` (`id`, `loyalty_tier_id`, `reward_text`, `display_order`, `created_at`, `updated_at`) VALUES (12, 3, 'Legend Fan badge', 5, '2026-07-15 05:15:10', '2026-07-15 05:15:10');
INSERT INTO `seasons` (`id`, `code`, `name`, `status`, `starts_at`, `ends_at`, `total_weeks`, `points_budget`, `created_at`, `updated_at`) VALUES (1, 'S01', 'Season 01', 'active', '2026-07-01 00:00:00', '2026-07-31 23:59:59', 4, NULL, '2026-07-15 05:15:10', '2026-07-15 05:15:10');
INSERT INTO `season_weeks` (`id`, `season_id`, `week_number`, `code`, `name`, `description`, `starts_at`, `ends_at`, `point_multiplier`, `completion_bonus_points`, `is_active`, `created_at`, `updated_at`) VALUES (1, 1, 1, 'W1', 'Kickoff', 'Week 1 of the season', '2026-07-01 00:00:00', '2026-07-07 23:59:59', 1, 50, 1, '2026-07-15 05:15:10', '2026-07-15 05:15:10');
INSERT INTO `season_weeks` (`id`, `season_id`, `week_number`, `code`, `name`, `description`, `starts_at`, `ends_at`, `point_multiplier`, `completion_bonus_points`, `is_active`, `created_at`, `updated_at`) VALUES (2, 1, 2, 'W2', 'Build', 'Week 2 of the season', '2026-07-08 00:00:00', '2026-07-14 23:59:59', 1.25, 100, 1, '2026-07-15 05:15:10', '2026-07-15 05:15:10');
INSERT INTO `season_weeks` (`id`, `season_id`, `week_number`, `code`, `name`, `description`, `starts_at`, `ends_at`, `point_multiplier`, `completion_bonus_points`, `is_active`, `created_at`, `updated_at`) VALUES (3, 1, 3, 'W3', 'Peak', 'Week 3 of the season', '2026-07-15 00:00:00', '2026-07-21 23:59:59', 1.5, 150, 1, '2026-07-15 05:15:10', '2026-07-15 05:15:10');
INSERT INTO `season_weeks` (`id`, `season_id`, `week_number`, `code`, `name`, `description`, `starts_at`, `ends_at`, `point_multiplier`, `completion_bonus_points`, `is_active`, `created_at`, `updated_at`) VALUES (4, 1, 4, 'W4', 'Final', 'Week 4 of the season', '2026-07-22 00:00:00', '2026-07-31 23:59:59', 2, 200, 1, '2026-07-15 05:15:10', '2026-07-15 05:15:10');
INSERT INTO `earn_sources` (`id`, `season_id`, `name`, `points_min`, `points_max`, `points_label`, `description`, `display_order`, `created_at`, `updated_at`) VALUES (1, 1, 'Daily Claim', 10, 50, '10-50 points', 'Claim your daily points bonus', 1, '2026-07-15 05:15:10', '2026-07-15 05:15:10');
INSERT INTO `earn_sources` (`id`, `season_id`, `name`, `points_min`, `points_max`, `points_label`, `description`, `display_order`, `created_at`, `updated_at`) VALUES (2, 1, 'Weekly Tasks', 50, 500, '50-500 points', 'Complete weekly tasks for significant points', 2, '2026-07-15 05:15:10', '2026-07-15 05:15:10');
INSERT INTO `earn_sources` (`id`, `season_id`, `name`, `points_min`, `points_max`, `points_label`, `description`, `display_order`, `created_at`, `updated_at`) VALUES (3, 1, 'Referrals', 100, 1000, '100-1000 points', 'Earn points from successful referrals', 3, '2026-07-15 05:15:10', '2026-07-15 05:15:10');
INSERT INTO `earn_sources` (`id`, `season_id`, `name`, `points_min`, `points_max`, `points_label`, `description`, `display_order`, `created_at`, `updated_at`) VALUES (4, 1, 'Bonuses', 50, 500, '50-500 points', 'Special bonus points from events and achievements', 4, '2026-07-15 05:15:10', '2026-07-15 05:15:10');
INSERT INTO `streak_milestones` (`id`, `season_id`, `day_count`, `name`, `bonus_points`, `multiplier`, `description`, `created_at`, `updated_at`) VALUES (1, 1, 7, 'First Week Champion', 50, 1.25, 'Keep your streak going for 7 days straight!', '2026-07-15 05:15:10', '2026-07-15 05:15:10');
INSERT INTO `streak_milestones` (`id`, `season_id`, `day_count`, `name`, `bonus_points`, `multiplier`, `description`, `created_at`, `updated_at`) VALUES (2, 1, 14, 'Two Weeks Strong', 100, 1.5, 'You\'re on fire! Keep it up for 14 days!', '2026-07-15 05:15:10', '2026-07-15 05:15:10');
INSERT INTO `streak_milestones` (`id`, `season_id`, `day_count`, `name`, `bonus_points`, `multiplier`, `description`, `created_at`, `updated_at`) VALUES (3, 1, 30, 'One Month Legend', 300, 2, 'Incredible dedication! 30 days of consistency!', '2026-07-15 05:15:10', '2026-07-15 05:15:10');
INSERT INTO `streak_milestones` (`id`, `season_id`, `day_count`, `name`, `bonus_points`, `multiplier`, `description`, `created_at`, `updated_at`) VALUES (4, 1, 60, 'Two Months Elite', 500, 2.5, 'You are an absolute legend! 60 days of excellence!', '2026-07-15 05:15:10', '2026-07-15 05:15:10');
INSERT INTO `referral_milestones` (`id`, `season_id`, `target_count`, `reward_name`, `reward_description`, `bonus_points`, `display_order`, `created_at`, `updated_at`) VALUES (1, 1, 5, 'Referral Star', 'Congratulations! You have referred 5 friends.', 500, 1, '2026-07-15 05:15:10', '2026-07-15 05:15:10');
INSERT INTO `referral_milestones` (`id`, `season_id`, `target_count`, `reward_name`, `reward_description`, `bonus_points`, `display_order`, `created_at`, `updated_at`) VALUES (2, 1, 10, 'Referral Master', 'Awesome! You have referred 10 friends.', 1500, 2, '2026-07-15 05:15:10', '2026-07-15 05:15:10');
INSERT INTO `referral_milestones` (`id`, `season_id`, `target_count`, `reward_name`, `reward_description`, `bonus_points`, `display_order`, `created_at`, `updated_at`) VALUES (3, 1, 25, 'Referral Champion', 'Incredible! You have referred 25 friends.', 5000, 3, '2026-07-15 05:15:10', '2026-07-15 05:15:10');
INSERT INTO `referral_milestones` (`id`, `season_id`, `target_count`, `reward_name`, `reward_description`, `bonus_points`, `display_order`, `created_at`, `updated_at`) VALUES (4, 1, 50, 'Referral Legend', 'Legendary! You have referred 50 friends. You are a true brand ambassador!', 15000, 4, '2026-07-15 05:15:10', '2026-07-15 05:15:10');
INSERT INTO `tasks` (`id`, `season_id`, `season_week_id`, `code`, `name`, `description`, `points`, `platform`, `task_type`, `external_url`, `verification_required`, `is_active`, `display_order`, `starts_at`, `ends_at`, `created_at`, `updated_at`, `audience`, `staff_position`, `assigned_user_id`) VALUES (1, 1, 1, 'TASK_FOLLOW_X', 'Follow on X (Twitter)', 'Follow our official X account and share the love!', 25, 'x', 'social_follow', 'https://twitter.com/madfan', 1, 1, 1, NULL, NULL, '2026-07-15 05:15:10', '2026-07-15 05:15:10', 'fan', NULL, NULL);
INSERT INTO `tasks` (`id`, `season_id`, `season_week_id`, `code`, `name`, `description`, `points`, `platform`, `task_type`, `external_url`, `verification_required`, `is_active`, `display_order`, `starts_at`, `ends_at`, `created_at`, `updated_at`, `audience`, `staff_position`, `assigned_user_id`) VALUES (2, 1, 2, 'TASK_JOIN_DISCORD', 'Join Discord Community', 'Join our Discord server and introduce yourself!', 30, 'discord', 'join_server', 'https://discord.gg/madfan', 1, 1, 2, NULL, NULL, '2026-07-15 05:15:10', '2026-07-15 05:15:10', 'fan', NULL, NULL);
INSERT INTO `tasks` (`id`, `season_id`, `season_week_id`, `code`, `name`, `description`, `points`, `platform`, `task_type`, `external_url`, `verification_required`, `is_active`, `display_order`, `starts_at`, `ends_at`, `created_at`, `updated_at`, `audience`, `staff_position`, `assigned_user_id`) VALUES (3, 1, 3, 'TASK_SUBSCRIBE_TELEGRAM', 'Subscribe to Telegram', 'Join our Telegram channel for exclusive updates', 20, 'telegram', 'join_channel', 'https://t.me/madfan', 1, 1, 3, NULL, NULL, '2026-07-15 05:15:10', '2026-07-15 05:15:10', 'fan', NULL, NULL);
INSERT INTO `tasks` (`id`, `season_id`, `season_week_id`, `code`, `name`, `description`, `points`, `platform`, `task_type`, `external_url`, `verification_required`, `is_active`, `display_order`, `starts_at`, `ends_at`, `created_at`, `updated_at`, `audience`, `staff_position`, `assigned_user_id`) VALUES (4, 1, 4, 'TASK_SHARE_SOCIAL', 'Share on Social Media', 'Share Mad Fan on your social media and earn points!', 15, 'general', 'share', NULL, 0, 1, 4, NULL, NULL, '2026-07-15 05:15:10', '2026-07-15 05:15:10', 'fan', NULL, NULL);
INSERT INTO `tasks` (`id`, `season_id`, `season_week_id`, `code`, `name`, `description`, `points`, `platform`, `task_type`, `external_url`, `verification_required`, `is_active`, `display_order`, `starts_at`, `ends_at`, `created_at`, `updated_at`, `audience`, `staff_position`, `assigned_user_id`) VALUES (5, 1, 1, 'TASK_COMMENT_POSTS', 'Comment on Posts', 'Engage with our community by commenting on posts', 10, 'general', 'engagement', NULL, 0, 1, 5, NULL, NULL, '2026-07-15 05:15:10', '2026-07-15 05:15:10', 'fan', NULL, NULL);
INSERT INTO `tasks` (`id`, `season_id`, `season_week_id`, `code`, `name`, `description`, `points`, `platform`, `task_type`, `external_url`, `verification_required`, `is_active`, `display_order`, `starts_at`, `ends_at`, `created_at`, `updated_at`, `audience`, `staff_position`, `assigned_user_id`) VALUES (6, 1, 2, 'TASK_PARTICIPATE_POLLS', 'Participate in Polls', 'Vote and participate in our community polls', 5, 'general', 'poll', NULL, 0, 1, 6, NULL, NULL, '2026-07-15 05:15:10', '2026-07-15 05:15:10', 'fan', NULL, NULL);
INSERT INTO `tasks` (`id`, `season_id`, `season_week_id`, `code`, `name`, `description`, `points`, `platform`, `task_type`, `external_url`, `verification_required`, `is_active`, `display_order`, `starts_at`, `ends_at`, `created_at`, `updated_at`, `audience`, `staff_position`, `assigned_user_id`) VALUES (7, 1, 3, 'TASK_REFER_FRIEND', 'Refer a Friend', 'Invite a friend to join Mad Fan community', 100, 'general', 'referral', NULL, 1, 1, 7, NULL, NULL, '2026-07-15 05:15:10', '2026-07-15 05:15:10', 'fan', NULL, NULL);
INSERT INTO `tasks` (`id`, `season_id`, `season_week_id`, `code`, `name`, `description`, `points`, `platform`, `task_type`, `external_url`, `verification_required`, `is_active`, `display_order`, `starts_at`, `ends_at`, `created_at`, `updated_at`, `audience`, `staff_position`, `assigned_user_id`) VALUES (8, 1, 4, 'TASK_WEEKLY_CHALLENGE', 'Complete Weekly Challenge', 'Finish all weekly challenges for bonus points', 50, 'general', 'challenge', NULL, 0, 1, 8, NULL, NULL, '2026-07-15 05:15:10', '2026-07-15 05:15:10', 'fan', NULL, NULL);
INSERT INTO `task_steps` (`id`, `task_id`, `step_number`, `description`, `link_url`, `link_label`, `created_at`, `updated_at`) VALUES (1, 1, 1, 'Visit our X profile', 'https://twitter.com/madfan', 'Go to X Profile', '2026-07-15 05:15:10', '2026-07-15 05:15:10');
INSERT INTO `task_steps` (`id`, `task_id`, `step_number`, `description`, `link_url`, `link_label`, `created_at`, `updated_at`) VALUES (2, 1, 2, 'Click the follow button', NULL, NULL, '2026-07-15 05:15:10', '2026-07-15 05:15:10');
INSERT INTO `task_steps` (`id`, `task_id`, `step_number`, `description`, `link_url`, `link_label`, `created_at`, `updated_at`) VALUES (3, 1, 3, 'Verify your follow with proof', NULL, NULL, '2026-07-15 05:15:10', '2026-07-15 05:15:10');
INSERT INTO `task_steps` (`id`, `task_id`, `step_number`, `description`, `link_url`, `link_label`, `created_at`, `updated_at`) VALUES (4, 2, 1, 'Click the Discord link', 'https://discord.gg/madfan', 'Join Discord', '2026-07-15 05:15:10', '2026-07-15 05:15:10');
INSERT INTO `task_steps` (`id`, `task_id`, `step_number`, `description`, `link_url`, `link_label`, `created_at`, `updated_at`) VALUES (5, 2, 2, 'Accept the server invite', NULL, NULL, '2026-07-15 05:15:10', '2026-07-15 05:15:10');
INSERT INTO `permissions` (`id`, `name`, `guard_name`, `created_at`, `updated_at`) VALUES (1, 'dashboard.view', 'web', '2026-07-15 05:15:08', '2026-07-15 05:15:08');
INSERT INTO `permissions` (`id`, `name`, `guard_name`, `created_at`, `updated_at`) VALUES (2, 'users.view', 'web', '2026-07-15 05:15:08', '2026-07-15 05:15:08');
INSERT INTO `permissions` (`id`, `name`, `guard_name`, `created_at`, `updated_at`) VALUES (3, 'users.create', 'web', '2026-07-15 05:15:08', '2026-07-15 05:15:08');
INSERT INTO `permissions` (`id`, `name`, `guard_name`, `created_at`, `updated_at`) VALUES (4, 'users.update', 'web', '2026-07-15 05:15:08', '2026-07-15 05:15:08');
INSERT INTO `permissions` (`id`, `name`, `guard_name`, `created_at`, `updated_at`) VALUES (5, 'users.delete', 'web', '2026-07-15 05:15:08', '2026-07-15 05:15:08');
INSERT INTO `permissions` (`id`, `name`, `guard_name`, `created_at`, `updated_at`) VALUES (6, 'users.assign-role', 'web', '2026-07-15 05:15:08', '2026-07-15 05:15:08');
INSERT INTO `permissions` (`id`, `name`, `guard_name`, `created_at`, `updated_at`) VALUES (7, 'staff.view', 'web', '2026-07-15 05:15:08', '2026-07-15 05:15:08');
INSERT INTO `permissions` (`id`, `name`, `guard_name`, `created_at`, `updated_at`) VALUES (8, 'staff.manage', 'web', '2026-07-15 05:15:08', '2026-07-15 05:15:08');
INSERT INTO `permissions` (`id`, `name`, `guard_name`, `created_at`, `updated_at`) VALUES (9, 'tasks.manage', 'web', '2026-07-15 05:15:08', '2026-07-15 05:15:08');
INSERT INTO `permissions` (`id`, `name`, `guard_name`, `created_at`, `updated_at`) VALUES (10, 'seasons.manage', 'web', '2026-07-15 05:15:08', '2026-07-15 05:15:08');
INSERT INTO `permissions` (`id`, `name`, `guard_name`, `created_at`, `updated_at`) VALUES (11, 'loyalty-tiers.manage', 'web', '2026-07-15 05:15:08', '2026-07-15 05:15:08');
INSERT INTO `permissions` (`id`, `name`, `guard_name`, `created_at`, `updated_at`) VALUES (12, 'referrals.view', 'web', '2026-07-15 05:15:08', '2026-07-15 05:15:08');
INSERT INTO `permissions` (`id`, `name`, `guard_name`, `created_at`, `updated_at`) VALUES (13, 'point-transactions.view', 'web', '2026-07-15 05:15:08', '2026-07-15 05:15:08');
INSERT INTO `permissions` (`id`, `name`, `guard_name`, `created_at`, `updated_at`) VALUES (14, 'settings.view', 'web', '2026-07-15 05:15:08', '2026-07-15 05:15:08');
INSERT INTO `permissions` (`id`, `name`, `guard_name`, `created_at`, `updated_at`) VALUES (15, 'settings.update', 'web', '2026-07-15 05:15:08', '2026-07-15 05:15:08');
INSERT INTO `permissions` (`id`, `name`, `guard_name`, `created_at`, `updated_at`) VALUES (16, 'admins.view', 'web', '2026-07-15 05:15:08', '2026-07-15 05:15:08');
INSERT INTO `permissions` (`id`, `name`, `guard_name`, `created_at`, `updated_at`) VALUES (17, 'admins.manage', 'web', '2026-07-15 05:15:08', '2026-07-15 05:15:08');
INSERT INTO `permissions` (`id`, `name`, `guard_name`, `created_at`, `updated_at`) VALUES (18, 'roles.view', 'web', '2026-07-15 05:15:08', '2026-07-15 05:15:08');
INSERT INTO `permissions` (`id`, `name`, `guard_name`, `created_at`, `updated_at`) VALUES (19, 'roles.manage', 'web', '2026-07-15 05:15:08', '2026-07-15 05:15:08');
INSERT INTO `permissions` (`id`, `name`, `guard_name`, `created_at`, `updated_at`) VALUES (20, 'activity-logs.view', 'web', '2026-07-15 05:15:08', '2026-07-15 05:15:08');
INSERT INTO `permissions` (`id`, `name`, `guard_name`, `created_at`, `updated_at`) VALUES (21, 'system-logs.view', 'web', '2026-07-15 05:15:08', '2026-07-15 05:15:08');
INSERT INTO `permissions` (`id`, `name`, `guard_name`, `created_at`, `updated_at`) VALUES (22, 'system-logs.clear', 'web', '2026-07-15 05:15:08', '2026-07-15 05:15:08');
INSERT INTO `roles` (`id`, `name`, `guard_name`, `created_at`, `updated_at`) VALUES (1, 'super-admin', 'web', '2026-07-15 05:15:08', '2026-07-15 05:15:08');
INSERT INTO `roles` (`id`, `name`, `guard_name`, `created_at`, `updated_at`) VALUES (2, 'admin', 'web', '2026-07-15 05:15:08', '2026-07-15 05:15:08');
INSERT INTO `roles` (`id`, `name`, `guard_name`, `created_at`, `updated_at`) VALUES (3, 'support', 'web', '2026-07-15 05:15:08', '2026-07-15 05:15:08');
INSERT INTO `roles` (`id`, `name`, `guard_name`, `created_at`, `updated_at`) VALUES (4, 'management', 'web', '2026-07-15 05:15:08', '2026-07-15 05:15:08');
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES (1, 1);
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES (2, 1);
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES (3, 1);
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES (4, 1);
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES (5, 1);
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES (6, 1);
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES (7, 1);
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES (8, 1);
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES (9, 1);
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES (10, 1);
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES (11, 1);
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES (12, 1);
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES (13, 1);
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES (14, 1);
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES (15, 1);
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES (16, 1);
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES (17, 1);
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES (18, 1);
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES (19, 1);
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES (20, 1);
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES (21, 1);
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES (22, 1);
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES (1, 2);
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES (2, 2);
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES (3, 2);
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES (4, 2);
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES (5, 2);
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES (6, 2);
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES (7, 2);
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES (8, 2);
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES (9, 2);
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES (10, 2);
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES (11, 2);
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES (12, 2);
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES (13, 2);
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES (14, 2);
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES (15, 2);
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES (16, 2);
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES (18, 2);
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES (20, 2);
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES (21, 2);
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES (1, 4);
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES (2, 4);
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES (3, 4);
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES (4, 4);
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES (7, 4);
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES (8, 4);
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES (9, 4);
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES (10, 4);
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES (11, 4);
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES (12, 4);
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES (13, 4);
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES (20, 4);
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES (1, 3);
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES (2, 3);
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES (7, 3);
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES (12, 3);
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES (20, 3);
INSERT INTO `users` (`id`, `email`, `password_hash`, `firebase_uid`, `auth_provider`, `name`, `username`, `handle`, `fan_id`, `country`, `league`, `club`, `avatar_emoji`, `loyalty_tier_id`, `total_points`, `current_streak_days`, `best_streak_days`, `referral_count`, `email_verified_at`, `last_login_at`, `remember_token`, `created_at`, `updated_at`, `is_staff`, `staff_position`, `staff_position_assigned_at`, `staff_position_assigned_by`, `staff_status`, `token_version`, `avatar_path`, `shootout_window_earned`, `shootout_cooldown_until`, `shootout_last_awarded_at`, `shootout_losses_today`, `shootout_stats_date`) VALUES (1, 'admin@madfan.test', '$2y$12$V6lfFTcqoRVqt3.N983k7ewXomXQPc/hwZMLFt2dMpi.WJJss/5Gi', NULL, 'password', 'Mad Fan Admin', 'filamentadmin', NULL, 'MF-ADMIN', NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0, NULL, NULL, NULL, '2026-07-15 05:15:09', '2026-07-15 05:15:09', 0, NULL, NULL, NULL, NULL, 1, NULL, 0, NULL, NULL, 0, NULL);
INSERT INTO `model_has_roles` (`role_id`, `model_type`, `model_id`) VALUES (1, 'App\\Models\\User', 1);
INSERT INTO `settings` (`id`, `key`, `value`, `description`, `type`, `created_at`, `updated_at`) VALUES (1, 'registration_enabled', 'true', 'When disabled, the public registration form and API signup are blocked.', 'boolean', '2026-07-15 05:15:10', '2026-07-15 05:15:10');
INSERT INTO `settings` (`id`, `key`, `value`, `description`, `type`, `created_at`, `updated_at`) VALUES (2, 'referral_bonus_points', '500', 'Points awarded to the referrer when someone registers with their link.', 'integer', '2026-07-15 05:15:10', '2026-07-15 05:15:10');
INSERT INTO `settings` (`id`, `key`, `value`, `description`, `type`, `created_at`, `updated_at`) VALUES (3, 'daily_claim_base_points', '10', 'Base points awarded for a daily claim.', 'integer', '2026-07-15 05:15:10', '2026-07-15 05:15:10');
INSERT INTO `settings` (`id`, `key`, `value`, `description`, `type`, `created_at`, `updated_at`) VALUES (4, 'shootout_window_shots', '15', 'Scoring shots a fan can take from penalty shootouts before a cooldown starts.', 'integer', '2026-07-15 05:15:10', '2026-07-15 05:15:10');
INSERT INTO `settings` (`id`, `key`, `value`, `description`, `type`, `created_at`, `updated_at`) VALUES (5, 'shootout_cooldown_minutes', '60', 'Minutes a fan must wait after filling their shootout window before earning again.', 'integer', '2026-07-15 05:15:10', '2026-07-15 05:15:10');
INSERT INTO `settings` (`id`, `key`, `value`, `description`, `type`, `created_at`, `updated_at`) VALUES (6, 'shootout_min_seconds_between', '5', 'Minimum seconds between credited shootout wins (anti-farm spacing).', 'integer', '2026-07-15 05:15:10', '2026-07-15 05:15:10');
INSERT INTO `settings` (`id`, `key`, `value`, `description`, `type`, `created_at`, `updated_at`) VALUES (7, 'shootout_corner_bonus_enabled', 'false', 'When disabled, every credited shootout win awards +1 regardless of zone (stronger anti-farm).', 'boolean', '2026-07-15 05:15:10', '2026-07-15 05:15:10');
INSERT INTO `settings` (`id`, `key`, `value`, `description`, `type`, `created_at`, `updated_at`) VALUES (8, 'streak_reset_hours', '48', 'Maximum hours between claims before a streak resets.', 'integer', '2026-07-15 05:15:10', '2026-07-15 05:15:10');
INSERT INTO `settings` (`id`, `key`, `value`, `description`, `type`, `created_at`, `updated_at`) VALUES (9, 'mail_mailer', 'log', 'Transport used to deliver outgoing email.', 'select', '2026-07-15 05:15:10', '2026-07-15 05:15:10');
INSERT INTO `settings` (`id`, `key`, `value`, `description`, `type`, `created_at`, `updated_at`) VALUES (10, 'mail_host', '127.0.0.1', 'Mail server hostname (for SMTP driver).', 'text', '2026-07-15 05:15:10', '2026-07-15 05:15:10');
INSERT INTO `settings` (`id`, `key`, `value`, `description`, `type`, `created_at`, `updated_at`) VALUES (11, 'mail_port', '2525', 'Mail server port, typically 587 for TLS or 465 for SSL.', 'integer', '2026-07-15 05:15:10', '2026-07-15 05:15:10');
INSERT INTO `settings` (`id`, `key`, `value`, `description`, `type`, `created_at`, `updated_at`) VALUES (12, 'mail_username', NULL, 'Authentication username for the mail server.', 'text', '2026-07-15 05:15:10', '2026-07-15 05:15:10');
INSERT INTO `settings` (`id`, `key`, `value`, `description`, `type`, `created_at`, `updated_at`) VALUES (13, 'mail_password', '', 'Leave blank to keep the current password unchanged.', 'password', '2026-07-15 05:15:10', '2026-07-15 05:15:10');
INSERT INTO `settings` (`id`, `key`, `value`, `description`, `type`, `created_at`, `updated_at`) VALUES (14, 'mail_encryption', 'tls', 'Transport encryption for SMTP connections.', 'select', '2026-07-15 05:15:10', '2026-07-15 05:15:10');
INSERT INTO `settings` (`id`, `key`, `value`, `description`, `type`, `created_at`, `updated_at`) VALUES (15, 'mail_from_address', 'hello@example.com', 'Default sender address for system emails.', 'email', '2026-07-15 05:15:10', '2026-07-15 05:15:10');
INSERT INTO `settings` (`id`, `key`, `value`, `description`, `type`, `created_at`, `updated_at`) VALUES (16, 'mail_from_name', 'MadFan', 'Display name shown alongside the from address.', 'text', '2026-07-15 05:15:10', '2026-07-15 05:15:10');
INSERT INTO `settings` (`id`, `key`, `value`, `description`, `type`, `created_at`, `updated_at`) VALUES (17, 'send_registration_welcome_email', 'false', 'Email new fans after they create a passport.', 'boolean', '2026-07-15 05:15:10', '2026-07-15 05:15:10');
INSERT INTO `settings` (`id`, `key`, `value`, `description`, `type`, `created_at`, `updated_at`) VALUES (18, 'registration_welcome_email_subject', 'Welcome to Mad Fan!', 'Subject line for the registration welcome email.', 'text', '2026-07-15 05:15:10', '2026-07-15 05:15:10');
INSERT INTO `settings` (`id`, `key`, `value`, `description`, `type`, `created_at`, `updated_at`) VALUES (19, 'social_verification_required', 'false', 'When enabled, fans must connect X and Discord before using the app.', 'boolean', '2026-07-15 05:15:11', '2026-07-15 05:15:11');
INSERT INTO `settings` (`id`, `key`, `value`, `description`, `type`, `created_at`, `updated_at`) VALUES (20, 'task_social_verification_enabled', 'false', 'When enabled, task confirms call X/Discord/Telegram APIs. When disabled (recommended), fans submit for admin manual review.', 'boolean', '2026-07-15 05:15:11', '2026-07-15 05:15:11');
INSERT INTO `settings` (`id`, `key`, `value`, `description`, `type`, `created_at`, `updated_at`) VALUES (21, 'discord_invite_url', 'https://discord.gg/madfan', 'Official Discord server invite link.', 'text', '2026-07-15 05:15:11', '2026-07-15 05:15:11');
INSERT INTO `settings` (`id`, `key`, `value`, `description`, `type`, `created_at`, `updated_at`) VALUES (22, 'telegram_channel_username', '@madfan', 'Target Telegram channel username or ID used for verification.', 'text', '2026-07-15 05:15:11', '2026-07-15 05:15:11');
INSERT INTO `settings` (`id`, `key`, `value`, `description`, `type`, `created_at`, `updated_at`) VALUES (23, 'twitter_target_username', 'madfan', 'Target X account handle used for follow verification.', 'text', '2026-07-15 05:15:11', '2026-07-15 05:15:11');
INSERT INTO `settings` (`id`, `key`, `value`, `description`, `type`, `created_at`, `updated_at`) VALUES (24, 'system_maintenance', 'false', 'When enabled, fan routes are blocked for regular users. Admin panel and admin accounts are unaffected.', 'boolean', '2026-07-15 05:15:11', '2026-07-15 05:15:11');

SET FOREIGN_KEY_CHECKS = 1;
