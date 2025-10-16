package com.tammudu.cmds;
import com.tammudu.files.*;
import com.tammudu.config.*;
import com.tammudu.managers.*;
import com.tammudu.chat.GeminiChatService;
import com.tammudu.logs.BotLogger;

import java.util.List;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.regex.Pattern;

import org.telegram.telegrambots.meta.api.objects.Update;

public class UpdateHandler {

    private static final Pattern DATE_QUERY_PATTERN = Pattern.compile(
            "(?:what(?:'s| is)?\\s+the\\s+date|date\\s+today|today\\s+is\\s+what\\s+day|what\\s+day\\s+is\\s+it|which\\s+day\\s+is\\s+today|current\\s+date|tell\\s+me\\s+the\\s+date)",
            Pattern.CASE_INSENSITIVE);
    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("EEEE, MMMM d, yyyy", Locale.US);
    private static final ZoneId DEFAULT_ZONE = ZoneId.systemDefault();

    public static void handle(Update update, PaymentTelegramBot bot) {
        if (update.hasMessage() && update.getMessage().hasText()) {
            String messageText = update.getMessage().getText().trim();
            Long chatId = update.getMessage().getChatId();
            Long userId = update.getMessage().getFrom().getId();
// This is the user input to remeber the card digit and select at the drop down at check out
            if (BotSessionManager.isExpectingCardStartDigit(chatId)) {
                String input = messageText.trim();

                // ✅ Validate: Must be exactly one digit
                if (!input.matches("\\d") || input.length() != 1) {
                    bot.sendMessage(chatId, "❌ Please enter exactly one digit (0-9) as the first digit of your card.", true);
                    return;
                }

                BotSessionManager.setExpectingCardStartDigit(chatId, false);
                char firstDigit = input.charAt(0);

                bot.sendMessage(chatId, "✅ Got it! Preloading Started, Please Wait...", false);
                try {
                    RealTimeSeleniumProcessor.preloadCheckoutPage(firstDigit);
                    bot.sendMessage(chatId, "✅ Pre-Load is Ready", false);
                } catch (Exception e) {
                    bot.sendMessage(chatId, "❌ Error during preload: " + e.getMessage(), false);
                }
                return;
            }

            if (BotSessionManager.isExpectingGeneratorExpiry(chatId)) {
                String expiryInput = messageText.trim();
                CommandHandler.handleGenerateExpiry(bot, chatId, userId, expiryInput);
                return;
            }
            if (BotSessionManager.isExpectingGeneratorQuantity(chatId)) {
                String quantityInput = messageText.trim();
                CommandHandler.handleGenerateQuantity(bot, chatId, userId, quantityInput);
                return;
            }
//-------------------------------------------------Upto here it is preload logic-----------------------------------------------------
            if (handleDateQuestion(messageText, bot, chatId)) {
                return;
            }

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
            } /*else if (messageText.startsWith("/duck")) {
            if (UserManager.isUserAllowed(userId) || bot.isAdminOrDev(userId)) {
            String cardDetails = messageText.replace("/duck", "").trim();
            CommandHandler.handleDuckLuck(bot, chatId, cardDetails);
        } else {
            bot.sendMessage(chatId, "❌ You are not authorized to use `/duck`. Contact admin!", false);
        }*/  else if (messageText.startsWith("/fetsluck")) {
                if (UserManager.isUserAllowed(userId) || bot.isAdminOrDev(userId)) {
                	String cardDetails = messageText.replace("/fetsluck", "").trim();
                	CommandHandler.handleFetsLuck(bot, chatId, cardDetails, userId);
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
            } else if (messageText.startsWith("/stop")) {
                BotSessionManager.resetSession(chatId);  // 🔄 clear all pending session flags
                ConversationHistoryManager.clear(chatId);
                bot.sendMessage(chatId, "🛑 All active processes stopped. Bot is now idle.", false);
            }
            else if (messageText.toLowerCase().startsWith("/bin")) {
                String arg = messageText.replaceFirst("(?i)/bin", "").trim();
                CommandHandler.handleBinLookup(bot, chatId, arg, userId);
            }
            else if (messageText.toLowerCase().startsWith(".gen")) {
                String arg = (messageText.length() > 4) ? messageText.substring(4).trim() : "";
                CommandHandler.handleGenerateStart(bot, chatId, userId, arg);
            }
            else if (messageText.startsWith("/myuserid")) {
                CommandHandler.handleMyUserId(bot, chatId, userId);
            } else if (GeminiChatService.isConfigured() && !messageText.startsWith("/")) {
                String firstName = update.getMessage().getFrom() != null
                        ? update.getMessage().getFrom().getFirstName()
                        : null;
                String formattedUserMessage = formatUserMessage(firstName, messageText);
                ConversationHistoryManager.recordUserMessage(chatId, formattedUserMessage);
                List<ConversationHistoryManager.Entry> history = ConversationHistoryManager.getRecentHistory(chatId);
                bot.runAsync(() -> {
                    try {
                        String aiResponse = GeminiChatService.generateReply(history, firstName);
                        ConversationHistoryManager.recordAssistantMessage(chatId, aiResponse);
                        bot.sendMessage(chatId, aiResponse, false);
                    } catch (Exception ex) {
                        String reason = sanitizeErrorMessage(ex.getMessage());
                        BotLogger.logAction("Gemini error for chat " + chatId + ": " + reason);
                        bot.sendMessage(chatId,
                                "I couldn't get a smart answer (" + reason + "). Please try again in a bit.",
                                false);
                    }
                });
            } else {
                bot.sendMessage(chatId, "❌ Unknown command. Use /commands to see all commands.", false);
            }
        }
    }

    private static boolean handleDateQuestion(String messageText, PaymentTelegramBot bot, Long chatId) {
        if (messageText == null) {
            return false;
        }
        String normalized = messageText.toLowerCase(Locale.ROOT).replaceAll("\\s+", " ");
        boolean explicitMatch = DATE_QUERY_PATTERN.matcher(normalized).find();
        boolean heuristicMatch = normalized.contains("today") && (normalized.contains("date") || normalized.contains("day"));
        if (explicitMatch || heuristicMatch) {
            LocalDate today = LocalDate.now(DEFAULT_ZONE);
            String formatted = today.format(DATE_FORMATTER);
            bot.sendMessage(chatId, "Today is **" + formatted + "**", true);
            return true;
        }
        return false;
    }

    private static String sanitizeErrorMessage(String raw) {
        if (raw == null || raw.isBlank()) {
            return "no details";
        }
        String cleaned = raw.replaceAll("[\r\n]+", " ").trim();
        if (cleaned.length() > 200) {
            cleaned = cleaned.substring(0, 197) + "...";
        }
        return cleaned;
    }

    private static String formatUserMessage(String firstName, String message) {
        if (message == null) {
            return "";
        }
        if (firstName == null || firstName.isBlank()) {
            return message;
        }
        return firstName.trim() + ": " + message;
    }
}
