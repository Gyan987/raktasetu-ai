CREATE TABLE `bloodBanks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`area` varchar(255) NOT NULL,
	`phone` varchar(32) NOT NULL,
	`isOpen24x7` int DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bloodBanks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bloodCamps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`organizer` varchar(255) NOT NULL,
	`location` varchar(512) NOT NULL,
	`date` varchar(16) NOT NULL,
	`registeredCount` int DEFAULT 0,
	`capacity` int DEFAULT 100,
	`userId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bloodCamps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `donors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`bloodGroup` enum('O-','O+','A-','A+','B-','B+','AB-','AB+') NOT NULL,
	`area` varchar(255) NOT NULL,
	`phone` varchar(32) NOT NULL,
	`lastDonationDate` varchar(16),
	`isFirstTime` int DEFAULT 0,
	`userId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `donors_id` PRIMARY KEY(`id`)
);
