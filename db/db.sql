-- Create a new database (optional, if it doesn't exist)
CREATE DATABASE IF NOT EXISTS crm_db;
USE crm_db;

-- -----------------------------------------------------
-- Table `users`
-- Stores information about the field representatives.
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `full_name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL, -- For a real app, store hashed passwords
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;


-- -----------------------------------------------------
-- Table `hcps` (Healthcare Professionals)
-- Master list of all doctors and other HCPs.
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `hcps` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `full_name` VARCHAR(255) NOT NULL,
  `specialty` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;


-- -----------------------------------------------------
-- Table `interactions`
-- The core table for logging all HCP interactions.
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `interactions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `hcp_id` INT NOT NULL,
  `interaction_type` ENUM('Meeting', 'Call', 'Email', 'Conference') NOT NULL DEFAULT 'Meeting',
  `interaction_date` DATE NOT NULL,
  `interaction_time` TIME NOT NULL,
  `topics_discussed` TEXT NULL,
  `sentiment` ENUM('Positive', 'Neutral', 'Negative') NOT NULL DEFAULT 'Neutral',
  `outcomes` TEXT NULL,
  `follow_up_actions` TEXT NULL,
  `ai_suggested_follow_ups` JSON NULL, -- Stores the array of AI suggestions
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `fk_interactions_users_idx` (`user_id` ASC),
  INDEX `fk_interactions_hcps_idx` (`hcp_id` ASC),
  CONSTRAINT `fk_interactions_users`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_interactions_hcps`
    FOREIGN KEY (`hcp_id`)
    REFERENCES `hcps` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB;


-- -----------------------------------------------------
-- Table `interaction_attendees`
-- Junction table to link multiple attendees to a single interaction.
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `interaction_attendees` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `interaction_id` INT NOT NULL,
  `attendee_name` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_attendees_interactions_idx` (`interaction_id` ASC),
  CONSTRAINT `fk_attendees_interactions`
    FOREIGN KEY (`interaction_id`)
    REFERENCES `interactions` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB;


-- -----------------------------------------------------
-- Table `interaction_materials_shared`
-- Logs all materials (e.g., brochures) shared in an interaction.
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `interaction_materials_shared` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `interaction_id` INT NOT NULL,
  `material_name` VARCHAR(255) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  INDEX `fk_materials_interactions_idx` (`interaction_id` ASC),
  CONSTRAINT `fk_materials_interactions`
    FOREIGN KEY (`interaction_id`)
    REFERENCES `interactions` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB;


-- -----------------------------------------------------
-- Table `interaction_samples_distributed`
-- Logs all product samples distributed in an interaction.
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `interaction_samples_distributed` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `interaction_id` INT NOT NULL,
  `sample_name` VARCHAR(255) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  INDEX `fk_samples_interactions_idx` (`interaction_id` ASC),
  CONSTRAINT `fk_samples_interactions`
    FOREIGN KEY (`interaction_id`)
    REFERENCES `interactions` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---
-- Add some sample data for testing
-- ---
INSERT INTO `users` (`full_name`, `email`, `password_hash`) VALUES ('John Doe', 'john.doe@example.com', 'hashed_password_placeholder');
INSERT INTO `hcps` (`full_name`, `specialty`) VALUES ('Dr. Alice Smith', 'Cardiology'), ('Dr. Bob Johnson', 'Oncology');

