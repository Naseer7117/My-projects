package com.tammudu.cmds;

import java.time.YearMonth;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.tammudu.files.BinLookupService;
import com.tammudu.files.CardGenerator;
import com.tammudu.files.PaymentTelegramBot;
import com.tammudu.files.RealTimeSeleniumProcessor;
import com.tammudu.logs.BotLogger;
import com.tammudu.managers.AdminManager;
import com.tammudu.managers.BinManager;
import com.tammudu.managers.BotSessionManager;
import com.tammudu.managers.UserManager;

public class CommandHandler {

    private static final int MAX_GENERATE_QUANTITY = 100000;
    private static final Pattern EXPIRY_TOKEN_PATTERN = Pattern.compile("^(0[1-9]|1[0-2])/\\d{2}$");

    public static void handleStart(PaymentTelegramBot bot, Long chatId) {
        bot.sendMessage(chatId, "What is the first digit of your card? (e.g. 4 for Visa, 5 for MasterCard)", true);
        BotSessionManager.setExpectingCardStartDigit(chatId, true);
    }

    public static void handleCommands(PaymentTelegramBot bot, Long chatId) {
        String commandsList = "Here are the available commands:\n\n" +
                "/start - Start the bot\n" +
                "/commands - List all available commands\n" +
                "/duck - Ducks your card\n" +
                "/bin <BIN> - Lookup BIN details\n" +
                ".gen <BIN> - Generate card numbers for the BIN\n" +
                "/fetsluck - Checker (under construction)\n" +
                "/check - Isn't developed yet\n" +
                "/myuserid - Show your Telegram User ID and Chat ID\n" +
                "/ban <BIN> - Ban a 6-digit BIN (Admin only)\n" +
                "/adduser <UserID> - Allow a user to use /duck and /fetsluck (Admin can give access)\n" +
                "/removeuser <UserID> - Remove a user (Admin Only)";
        bot.sendMessage(chatId, commandsList, false);
    }

    public static void handleDuckLuck() {
        // Reserved for future implementation
    }

    public static void handleFetsLuck(PaymentTelegramBot bot, Long chatId, String cardDetails, Long userId) {
        if (!UserManager.isUserAllowed(userId) && !bot.isAdminOrDev(userId)) {
            bot.sendMessage(chatId, "�?O You are not authorized to use `/fetsluck`. Contact admin!", false);
            return;
        }

        try {
            String[] parts = cardDetails.split("\\|");
            if (parts.length != 4) {
                bot.sendMessage(chatId, "�?O Invalid format. Use: /fetsluck 4111111111111111|02|25|555", true);
                return;
            }

            String ccNumber = parts[0].trim();
            String expMonth = parts[1].trim();
            String expYear = parts[2].trim();
            String userCVV = parts[3].trim();

            bot.sendMessage(chatId, "dYO? Processing your card with FetsLuck, please wait...", false);

            bot.runAsync(() -> {
                try {
                    String result = RealTimeSeleniumProcessor.processFetsLuckCard(ccNumber, expMonth, expYear, userCVV);
                    bot.sendMessage(chatId, result, false);
                } catch (Exception e) {
                    bot.sendMessage(chatId, "�?O Error during FetsLuck processing: " + e.getMessage(), false);
                }
            });

        } catch (Exception e) {
            bot.sendMessage(chatId, "�?O Something went wrong while parsing the card.", false);
        }
    }

    public static void handleCheck(PaymentTelegramBot bot, Long chatId) {
        bot.sendMessage(chatId, "�o. Check is not Built. Please send `/duck` command to check your card.", false);
    }

    public static void handleBanCommand(PaymentTelegramBot bot, Long chatId, String bin, Long userId) {
        if (bin.length() != 6 || !bin.matches("\\d{6}")) {
            bot.sendMessage(chatId, "�?O Please send a valid 6-digit BIN to ban.\nExample: `/ban 411111`", true);
            return;
        }
        BinManager.addBannedBin(bin);
        BotLogger.logAction("User " + userId + " banned BIN " + bin);
        bot.sendMessage(chatId, "�o. BIN `" + bin + "` has been successfully banned!", true);
    }

    public static void handleAddAdmin(PaymentTelegramBot bot, Long chatId, String adminIdStr) {
        try {
            long adminId = Long.parseLong(adminIdStr);
            AdminManager.addAdmin(adminId);
            BotLogger.logAction("DEV added Admin " + adminId);
            bot.sendMessage(chatId, "�o. Admin added: " + adminId, false);
        } catch (Exception e) {
            bot.sendMessage(chatId, "�?O Error adding admin.", false);
        }
    }

    public static void handleRemoveAdmin(PaymentTelegramBot bot, Long chatId, String adminIdStr) {
        try {
            long adminId = Long.parseLong(adminIdStr);
            AdminManager.removeAdmin(adminId);
            BotLogger.logAction("DEV removed Admin " + adminId);
            bot.sendMessage(chatId, "�o. Admin removed: " + adminId, false);
        } catch (Exception e) {
            bot.sendMessage(chatId, "�?O Error removing admin.", false);
        }
    }

    public static void handleAddUser(PaymentTelegramBot bot, Long chatId, String userIdStr, Long adminUserId) {
        try {
            long newUserId = Long.parseLong(userIdStr);
            UserManager.addUser(newUserId);
            BotLogger.logAction("Admin/DEV " + adminUserId + " added User " + newUserId);
            bot.sendMessage(chatId, "�o. User added: " + newUserId, false);
        } catch (Exception e) {
            bot.sendMessage(chatId, "�?O Error adding user.", false);
        }
    }

    public static void handleRemoveUser(PaymentTelegramBot bot, Long chatId, String userIdStr, Long adminUserId) {
        try {
            long removeUserId = Long.parseLong(userIdStr);
            UserManager.removeUser(removeUserId);
            BotLogger.logAction("Admin/DEV " + adminUserId + " removed User " + removeUserId);
            bot.sendMessage(chatId, "�o. User removed: " + removeUserId, false);
        } catch (Exception e) {
            bot.sendMessage(chatId, "�?O Error removing user.", false);
        }
    }

    public static void handleBinLookup(PaymentTelegramBot bot, Long chatId, String arg, Long userId) {
        if (arg == null || arg.isBlank()) {
            bot.sendMessage(chatId, "Usage: `/bin 4xxxxx` - provide a 6-12 digit BIN", true);
            return;
        }
        String requesterKey = buildRequesterKey(chatId, userId);
        String reply = BinLookupService.lookup(arg, requesterKey);
        bot.sendMessage(chatId, reply, true);
    }

    public static void handleGenerateStart(PaymentTelegramBot bot, Long chatId, Long userId, String binInput) {
        String digitsOnly = (binInput == null) ? "" : binInput.replaceAll("\\D", "");
        if (digitsOnly.isBlank()) {
            bot.sendMessage(chatId, "Please provide a BIN after `.gen`. Example: `.gen 444444`", false);
            return;
        }
        if (!(digitsOnly.length() == 6 || digitsOnly.length() == 8 || digitsOnly.length() == 10)) {
            bot.sendMessage(chatId, "BIN must be 6, 8, or 10 digits long.", false);
            return;
        }

        BotSessionManager.setExpectingCardStartDigit(chatId, false);
        BotSessionManager.clearGeneratorState(chatId);
        BotSessionManager.setPendingGeneratorBin(chatId, digitsOnly);
        BotSessionManager.setExpectingGeneratorExpiry(chatId, true);

        bot.sendMessage(chatId,
                "Any specific expiry range or type RND? (Example: `01/26 to 12/26` or `RND`)",
                true);
    }

    public static void handleGenerateExpiry(PaymentTelegramBot bot, Long chatId, Long userId, String expiryInput) {
        String pendingBin = BotSessionManager.getPendingGeneratorBin(chatId);
        if (pendingBin == null) {
            BotSessionManager.clearGeneratorState(chatId);
            bot.sendMessage(chatId, "No BIN found for generation. Send `.gen <BIN>` first.", false);
            return;
        }

        try {
            CardGenerator.ExpirySpec spec = parseExpirySpec(expiryInput);
            BotSessionManager.setPendingGeneratorExpiry(chatId, spec);
            BotSessionManager.setExpectingGeneratorExpiry(chatId, false);
            BotSessionManager.setExpectingGeneratorQuantity(chatId, true);
            bot.sendMessage(chatId,
                    "How many cards should I generate for BIN `" + pendingBin + "`? (1-" + MAX_GENERATE_QUANTITY + ")",
                    true);
        } catch (IllegalArgumentException ex) {
            bot.sendMessage(chatId, "Invalid expiry choice: " + ex.getMessage(), false);
        }
    }

    public static void handleGenerateQuantity(PaymentTelegramBot bot, Long chatId, Long userId, String quantityInput) {
        String pendingBin = BotSessionManager.getPendingGeneratorBin(chatId);
        if (pendingBin == null) {
            BotSessionManager.clearGeneratorState(chatId);
            bot.sendMessage(chatId, "No BIN found for generation. Send `.gen <BIN>` first.", false);
            return;
        }

        String trimmed = (quantityInput == null) ? "" : quantityInput.trim();
        if (!trimmed.matches("\\d+")) {
            bot.sendMessage(chatId, "Quantity must be a number between 1 and " + MAX_GENERATE_QUANTITY + ".", false);
            return;
        }

        int quantity;
        try {
            quantity = Integer.parseInt(trimmed);
        } catch (NumberFormatException e) {
            bot.sendMessage(chatId, "Quantity is too large. Maximum allowed is " + MAX_GENERATE_QUANTITY + ".", false);
            return;
        }

        if (quantity <= 0) {
            bot.sendMessage(chatId, "Quantity must be at least 1.", false);
            return;
        }
        if (quantity > MAX_GENERATE_QUANTITY) {
            bot.sendMessage(chatId, "Maximum quantity is " + MAX_GENERATE_QUANTITY + ".", false);
            return;
        }

        CardGenerator.ExpirySpec expirySpec = BotSessionManager.getPendingGeneratorExpiry(chatId);
        if (expirySpec == null) {
            expirySpec = CardGenerator.randomSpec();
        }

        final String binForTask = pendingBin;
        final int quantityForTask = quantity;
        final CardGenerator.ExpirySpec specForTask = expirySpec;

        BotSessionManager.clearGeneratorState(chatId);
        bot.sendMessage(chatId,
                "Generating " + quantityForTask + " cards for BIN `" + binForTask + "`...",
                true);

        bot.runAsync(() -> {
            try {
                String payload = CardGenerator.generateBatch(binForTask, quantityForTask, specForTask);
                BotLogger.logAction("User " + userId + " generated " + quantityForTask + " cards for BIN "
                        + binForTask + " (" + specForTask + ")");

                if (shouldSendCardsInline(quantityForTask)) {
                    bot.sendMessage(chatId, "Here are your cards:\n" + payload, false);
                } else {
                    String fileName = "cards_" + binForTask + "_" + System.currentTimeMillis() + ".txt";
                    bot.sendDocument(chatId, fileName, payload);
                    bot.sendMessage(chatId,
                            "Generated " + quantityForTask + " cards for BIN `" + binForTask + "` and uploaded as a file.", true);
                }
            } catch (IllegalArgumentException ex) {
                bot.sendMessage(chatId, "Unable to generate cards: " + ex.getMessage(), false);
            } catch (Exception ex) {
                bot.sendMessage(chatId, "Unexpected error while generating cards: " + ex.getMessage(), false);
            }
        });
    }

    private static boolean shouldSendCardsInline(int quantity) {
        return quantity <= 150;
    }

    private static String buildRequesterKey(Long chatId, Long userId) {
        if (userId != null) {
            return "user:" + userId;
        }
        if (chatId != null) {
            return "chat:" + chatId;
        }
        return "unknown";
    }

    public static void handleMyUserId(PaymentTelegramBot bot, Long chatId, Long userId) {
        String response = "dY`\u000f *Your Telegram User ID:* `" + userId + "`\n" +
                "dY'� *Your Chat ID:* `" + chatId + "`";
        bot.sendMessage(chatId, response, true);
    }

    private static CardGenerator.ExpirySpec parseExpirySpec(String rawInput) {
        String input = rawInput == null ? "" : rawInput.trim();
        if (input.isEmpty()) {
            throw new IllegalArgumentException("Please enter a range like `01/26 to 12/26` or `RND`.");
        }

        if ("RND".equalsIgnoreCase(input)) {
            return CardGenerator.randomSpec();
        }

        String normalized = input.toUpperCase(Locale.ROOT);
        String[] parts = normalized.split("\\s*TO\\s*");
        if (parts.length != 2) {
            throw new IllegalArgumentException("Use the format `MM/YY to MM/YY`.");
        }

        YearMonth start = parseExpiryToken(parts[0]);
        YearMonth end = parseExpiryToken(parts[1]);

        YearMonth now = YearMonth.now();
        if (start.isBefore(now)) {
            throw new IllegalArgumentException("Start month must be in the future.");
        }

        if (end.isBefore(start)) {
            throw new IllegalArgumentException("End month must be after start month.");
        }

        YearMonth max = now.plusYears(CardGenerator.MAX_YEARS_AHEAD);
        if (end.isAfter(max)) {
            throw new IllegalArgumentException("Range must be within the next " + CardGenerator.MAX_YEARS_AHEAD + " years.");
        }

        return CardGenerator.rangeSpec(start, end);
    }

    private static YearMonth parseExpiryToken(String token) {
        String candidate = token == null ? "" : token.trim().replace('|', '/');
        Matcher matcher = EXPIRY_TOKEN_PATTERN.matcher(candidate);
        if (!matcher.matches()) {
            throw new IllegalArgumentException("Invalid expiry `" + token.trim() + "`.");
        }
        int month = Integer.parseInt(matcher.group(1));
        int yearTwoDigits = Integer.parseInt(candidate.substring(candidate.length() - 2));
        int year = 2000 + yearTwoDigits;
        return YearMonth.of(year, month);
    }
}
