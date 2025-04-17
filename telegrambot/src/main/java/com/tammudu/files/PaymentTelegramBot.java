package com.tammudu.files;
import com.tammudu.config.*;
import com.tammudu.managers.*;
import com.tammudu.cmds.*;

import org.telegram.telegrambots.bots.TelegramLongPollingBot;
import org.telegram.telegrambots.bots.DefaultBotOptions;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.exceptions.TelegramApiException;

public class PaymentTelegramBot extends TelegramLongPollingBot {

    private static final String BOT_USERNAME = ConfigLoader.get("bot.username");
    private static final String BOT_TOKEN = ConfigLoader.get("bot.token");

    private static final long DEV_ID = 1339935410L; // <-- Your real DEV Telegram ID

    public PaymentTelegramBot() {
        super(new DefaultBotOptions(), BOT_TOKEN);
        BinManager.loadBannedBins();
        AdminManager.loadAdmins();
        UserManager.loadUsers();
    }

    @Override
    public String getBotUsername() {
        return BOT_USERNAME;
    }

    @Override
    public void onUpdateReceived(Update update) {
        UpdateHandler.handle(update, this); // ✨ Delegate full logic to UpdateHandler
    }

    public long getDevId() {
        return DEV_ID;
    }

    // --- Universal send message method ---

    public void sendMessage(Long chatId, String text, boolean enableMarkdown) {
        SendMessage message = new SendMessage();
        message.setChatId(chatId.toString());
        message.setText(text);
        message.enableMarkdown(enableMarkdown);

        try {
            execute(message);
        } catch (TelegramApiException e) {
            e.printStackTrace();
        }
    }

    public boolean isAdminOrDev(Long userId) {
        return userId.equals(DEV_ID) || AdminManager.isAdmin(userId);
    }
}
