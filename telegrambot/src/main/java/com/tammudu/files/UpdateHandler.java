package com.tammudu.files;

import org.telegram.telegrambots.meta.api.objects.Update;

public class UpdateHandler {

    public static void handle(Update update, PaymentTelegramBot bot) {
        if (update.hasMessage() && update.getMessage().hasText()) {
            String messageText = update.getMessage().getText().trim();
            Long chatId = update.getMessage().getChatId();
            Long userId = update.getMessage().getFrom().getId();

            if (messageText.startsWith("/start")) {
                CommandHandler.handleStart(bot, chatId);
            } else if (messageText.startsWith("/onproxy")){
                if (userId.equals(bot.getDevId())) {
                    Proxies.enableProxy();
                    bot.sendMessage(chatId, "✅ Proxy has been enabled. All future requests will use proxies.", false);
                } else {
                    bot.sendMessage(chatId, "❌ You are not authorized to use /proxy.", false);
                }
            } else if (messageText.startsWith("/noproxy")) {
                if (userId.equals(bot.getDevId())) {
                    Proxies.disableProxy();
                    bot.sendMessage(chatId, "✅ Proxy has been disabled. All future requests will be direct (no proxy).", false);
                } else {
                    bot.sendMessage(chatId, "❌ You are not authorized to use /noproxy.", false);
                }
            } else if (messageText.startsWith("/proxystatus")) {
                if (userId.equals(bot.getDevId())) {
                    String status = Proxies.isProxyEnabled() ? "✅ Proxy is ENABLED." : "❌ Proxy is DISABLED.";
                    bot.sendMessage(chatId, "🔎 " + status, false);
                } else {
                    bot.sendMessage(chatId, "❌ You are not authorized to use /proxystatus.", false);
                }
            } else if (messageText.startsWith("/commands")) {
                CommandHandler.handleCommands(bot, chatId);
            } else if (messageText.startsWith("/duck")) {
                if (UserManager.isUserAllowed(userId) || bot.isAdminOrDev(userId)) {
                    String cardDetails = messageText.replace("/duck", "").trim();
                    CommandHandler.handleDuckLuck(bot, chatId, cardDetails);
                } else {
                    bot.sendMessage(chatId, "❌ You are not authorized to use `/duck`. Contact admin!", false);
                }
            } else if (messageText.startsWith("/fetsluck")) {
                if (UserManager.isUserAllowed(userId) || bot.isAdminOrDev(userId)) {
                    CommandHandler.handleFetsLuck(bot, chatId);
                } else {
                    bot.sendMessage(chatId, "❌ You are not authorized to use `/fetsluck`. Contact admin!", false);
                }
            } else if (messageText.startsWith("/check")) {
                CommandHandler.handleCheck(bot, chatId);
            } else if (messageText.startsWith("/ban")) {
                if (bot.isAdminOrDev(userId)) {
                    String binToBan = messageText.replace("/ban", "").trim();
                    CommandHandler.handleBanCommand(bot, chatId, binToBan, userId);
                } else {
                    bot.sendMessage(chatId, "❌ You are not authorized to use `/ban`.", false);
                }
            } else if (messageText.startsWith("/admin")) {
                if (userId.equals(bot.getDevId())) {
                    String adminId = messageText.replace("/admin", "").trim();
                    CommandHandler.handleAddAdmin(bot, chatId, adminId);
                } else {
                    bot.sendMessage(chatId, "❌ Only DEV can add admins.", false);
                }
            } else if (messageText.startsWith("/deadmin")) {
                if (userId.equals(bot.getDevId())) {
                    String adminId = messageText.replace("/deadmin", "").trim();
                    CommandHandler.handleRemoveAdmin(bot, chatId, adminId);
                } else {
                    bot.sendMessage(chatId, "❌ Only DEV can remove admins.", false);
                }
            } else if (messageText.startsWith("/adduser")) {
                if (bot.isAdminOrDev(userId)) {
                    String userIdToAdd = messageText.replace("/adduser", "").trim();
                    CommandHandler.handleAddUser(bot, chatId, userIdToAdd, userId);
                } else {
                    bot.sendMessage(chatId, "❌ You are not authorized to add users.", false);
                }
            } else if (messageText.startsWith("/removeuser")) {
                if (bot.isAdminOrDev(userId)) {
                    String userIdToRemove = messageText.replace("/removeuser", "").trim();
                    CommandHandler.handleRemoveUser(bot, chatId, userIdToRemove, userId);
                } else {
                    bot.sendMessage(chatId, "❌ You are not authorized to remove users.", false);
                }
            } else if (messageText.startsWith("/myuserid")) {
                CommandHandler.handleMyUserId(bot, chatId, userId);
            } else {
                bot.sendMessage(chatId, "❌ Unknown command. Use /commands to see all commands.", false);
            }
        }
    }
}
