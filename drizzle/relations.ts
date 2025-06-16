import { relations } from "drizzle-orm/relations";
import { guilds, channels, users, userGuilds } from "./schema";

export const channelsRelations = relations(channels, ({one}) => ({
	guild: one(guilds, {
		fields: [channels.guildId],
		references: [guilds.guildId]
	}),
}));

export const guildsRelations = relations(guilds, ({many}) => ({
	channels: many(channels),
	userGuilds: many(userGuilds),
}));

export const userGuildsRelations = relations(userGuilds, ({one}) => ({
	user: one(users, {
		fields: [userGuilds.userId],
		references: [users.userId]
	}),
	guild: one(guilds, {
		fields: [userGuilds.guildId],
		references: [guilds.guildId]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	userGuilds: many(userGuilds),
}));