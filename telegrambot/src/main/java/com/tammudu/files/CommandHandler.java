package com.tammudu.files;

public class CommandHandler {

    public static void handleStart(PaymentTelegramBot bot, Long chatId) {
        bot.sendMessage(chatId, "Reii Ducker-tammudu hahahah!\n", true);
    }

    public static void handleCommands(PaymentTelegramBot bot, Long chatId) {
        String commandsList = "Here are the available commands:\n\n" +
                "/start - Start the bot\n" +
                "/commands - List all available commands\n" +
                "/duck - ducks your card\n" +
                "/fetsluck - Checker (under construction)\n" +
                "/check - Isnt developed yet\n" +
                "/myuserid - Show your Telegram User ID and Chat ID\n" +
                "/ban <BIN> - Ban a 6-digit BIN (Admin only)\n" +
                "/adduser <UserID> - Allow a user to use /duck and /fetsluck (Admin can give access)\n" +
                "/removeuser <UserID> - Remove a user (Admin Only)";
        bot.sendMessage(chatId, commandsList, false);
    }

    public static void handleDuckLuck(PaymentTelegramBot bot, Long chatId, String cardDetails) {
        try {
            String[] parts = cardDetails.split("\\|");
            if (parts.length != 4) {
                bot.sendMessage(chatId, "❌ Incorrect format. Please send like: `4111111111111111|07|2025|123`", true);
                return;
            }

            String ccNumber = parts[0].trim();
            String expMonth = parts[1].trim();
            String expYear = parts[2].trim();
            String bin = ccNumber.substring(0, 6);

            if (BinManager.isBinBanned(bin)) {
                bot.sendMessage(chatId, "❌ This BIN is Banned Here !!!", false);
                return;
            }

            RealTimePaymentProcessor.validateInputs(ccNumber, expMonth, expYear);

            bot.sendMessage(chatId, "🦆 Ducking started!\nPlease wait while we duck your card ⏳", false);

            new Thread(() -> {
                try {
                    String result = RealTimePaymentProcessor.processPayment(cardDetails);
                    bot.sendMessage(chatId, result, false);
                } catch (Exception e) {
                    bot.sendMessage(chatId, "❌ Error while processing card: " + e.getMessage(), false);
                }
            }).start();

        } catch (Exception e) {
            bot.sendMessage(chatId, "❌ Error: " + e.getMessage(), false);
        }
    }

    public static void handleFetsLuck(PaymentTelegramBot bot, Long chatId) {
        bot.sendMessage(chatId, "🦆 FetsLuck is currently under construction. Stay tuned! 🚧", false);
    }

    public static void handleCheck(PaymentTelegramBot bot, Long chatId) {
        bot.sendMessage(chatId, "✅ Check is not Built. Please send `/duck` command to check your card.", false);
    }

    public static void handleBanCommand(PaymentTelegramBot bot, Long chatId, String bin, Long userId) {
        if (bin.length() != 6 || !bin.matches("\\d{6}")) {
            bot.sendMessage(chatId, "❌ Please send a valid 6-digit BIN to ban.\nExample: `/ban 411111`", true);
            return;
        }
        BinManager.addBannedBin(bin);
        BotLogger.logAction("User " + userId + " banned BIN " + bin);
        bot.sendMessage(chatId, "✅ BIN `" + bin + "` has been successfully banned!", true);
    }

    public static void handleAddAdmin(PaymentTelegramBot bot, Long chatId, String adminIdStr) {
        try {
            long adminId = Long.parseLong(adminIdStr);
            AdminManager.addAdmin(adminId);
            BotLogger.logAction("DEV added Admin " + adminId);
            bot.sendMessage(chatId, "✅ Admin added: " + adminId, false);
        } catch (Exception e) {
            bot.sendMessage(chatId, "❌ Error adding admin.", false);
        }
    }

    public static void handleRemoveAdmin(PaymentTelegramBot bot, Long chatId, String adminIdStr) {
        try {
            long adminId = Long.parseLong(adminIdStr);
            AdminManager.removeAdmin(adminId);
            BotLogger.logAction("DEV removed Admin " + adminId);
            bot.sendMessage(chatId, "✅ Admin removed: " + adminId, false);
        } catch (Exception e) {
            bot.sendMessage(chatId, "❌ Error removing admin.", false);
        }
    }

    public static void handleAddUser(PaymentTelegramBot bot, Long chatId, String userIdStr, Long adminUserId) {
        try {
            long newUserId = Long.parseLong(userIdStr);
            UserManager.addUser(newUserId);
            BotLogger.logAction("Admin/DEV " + adminUserId + " added User " + newUserId);
            bot.sendMessage(chatId, "✅ User added: " + newUserId, false);
        } catch (Exception e) {
            bot.sendMessage(chatId, "❌ Error adding user.", false);
        }
    }

    public static void handleRemoveUser(PaymentTelegramBot bot, Long chatId, String userIdStr, Long adminUserId) {
        try {
            long removeUserId = Long.parseLong(userIdStr);
            UserManager.removeUser(removeUserId);
            BotLogger.logAction("Admin/DEV " + adminUserId + " removed User " + removeUserId);
            bot.sendMessage(chatId, "✅ User removed: " + removeUserId, false);
        } catch (Exception e) {
            bot.sendMessage(chatId, "❌ Error removing user.", false);
        }
    }

    public static void handleMyUserId(PaymentTelegramBot bot, Long chatId, Long userId) {
        String response = "👤 *Your Telegram User ID:* `" + userId + "`\n" +
                          "💬 *Your Chat ID:* `" + chatId + "`";
        bot.sendMessage(chatId, response, true);
    }
}
