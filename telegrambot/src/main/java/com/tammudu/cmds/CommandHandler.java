package com.tammudu.cmds;
import com.tammudu.files.*;
import com.tammudu.managers.*;
import java.util.Arrays;
import java.net.URLEncoder;

public class CommandHandler {

	public static void handleStart(PaymentTelegramBot bot, Long chatId) {
	    bot.sendMessage(chatId, "What is the first digit of your card? (e.g. 4 for Visa, 5 for MasterCard)", true);
	    BotSessionManager.setExpectingCardStartDigit(chatId, true);
    }

    public static void handleCommands(PaymentTelegramBot bot, Long chatId) {
        String commandsList = "Here are the available commands:\n\n" +
                "/start - Start the bot\n" +
                "/commands - List all available commands\n" +
                "/duck - Ducks your card\n" +
                "/fetsluck - Checker (under construction)\n" +
                "/check - Isn't developed yet\n" +
                "/myuserid - Show your Telegram User ID and Chat ID\n" +
                "/ban <BIN> - Ban a 6-digit BIN (Admin only)\n" +
                "/adduser <UserID> - Allow a user to use /duck and /fetsluck (Admin can give access)\n" +
                "/removeuser <UserID> - Remove a user (Admin Only)";
        bot.sendMessage(chatId, commandsList, false);
    }
    public static void handleDuckLuck(PaymentTelegramBot bot, Long chatId, String cardDetails) {
        try {
            // Log the raw cardDetails input for debugging purposes
            System.out.println("Received card details: " + cardDetails);
            // Assuming cardDetails format: ccNumber|expMonth|expYear|cvv
            String[] cardParts = cardDetails.split("\\|");
           // Log the parts for debugging
            System.out.println("Parsed card parts: " + Arrays.toString(cardParts));

            if (cardParts.length != 4) {
                throw new IllegalArgumentException("Invalid card details format. Must be: ccNumber|expMonth|expYear|cvv");
            }
            // Extract and trim the card parts
            String cardNumber = cardParts[0].trim();
            String expiryMonth = cardParts[1].trim();
            String expiryYear = cardParts[2].trim();
            String cvv = cardParts[3].trim();
            if (cardNumber.isEmpty() || expiryMonth.isEmpty() || expiryYear.isEmpty() || cvv.isEmpty()) {
                throw new IllegalArgumentException("All card details must be provided.");
            }
            System.out.println("Card details validated: " +
                    "Card Number: " + cardNumber + ", Expiry Month: " + expiryMonth + ", Expiry Year: " + expiryYear + ", CVV: " + cvv);

            String url = "http://localhost:8081/index.html?cardDetails=" + URLEncoder.encode(cardDetails, "UTF-8");
            // Send the user a message with the link to the frontend for payment processing
            bot.sendMessage(chatId, "Please proceed with the payment using the following link: " + url, false);
        } catch (Exception e) {
            bot.sendMessage(chatId, "❌ Error: " + e.getMessage(), false);
            e.printStackTrace(); // Print the stack trace for debugging
        }
    }

    // 🔥 All other methods untouched exactly as you asked
    public static void handleFetsLuck(PaymentTelegramBot bot, Long chatId, String cardDetails, Long userId) {
        if (!UserManager.isUserAllowed(userId) && !bot.isAdminOrDev(userId)) {
            bot.sendMessage(chatId, "❌ You are not authorized to use `/fetsluck`. Contact admin!", false);
            return;
        }

        try {
            String[] parts = cardDetails.split("\\|");
            if (parts.length != 4) {
                bot.sendMessage(chatId, "❌ Invalid format. Use: /fetsluck 4111111111111111|02|25|555", true);
                return;
            }

            String ccNumber = parts[0].trim();
            String expMonth = parts[1].trim();
            String expYear = parts[2].trim();
            String userCVV = parts[3].trim();  // only used for parsing, ignored in Selenium

            bot.sendMessage(chatId, "🌀 Processing your card with FetsLuck, please wait...", false);

            new Thread(() -> {
                try {
                    String result = RealTimeSeleniumProcessor.processFetsLuckCard(ccNumber, expMonth, expYear, userCVV);
                    bot.sendMessage(chatId, result, false);
                } catch (Exception e) {
                    bot.sendMessage(chatId, "❌ Error during FetsLuck processing: " + e.getMessage(), false);
                }
            }).start();

        } catch (Exception e) {
            bot.sendMessage(chatId, "❌ Something went wrong while parsing the card.", false);
        }
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
