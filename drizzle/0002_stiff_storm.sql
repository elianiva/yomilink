ALTER TABLE `kits` ADD `nodes` text(1000000) DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `kits` ADD `edges` text(1000000) DEFAULT '[]' NOT NULL;