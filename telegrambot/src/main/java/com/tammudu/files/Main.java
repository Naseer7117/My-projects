package com.tammudu.files;

import org.telegram.telegrambots.meta.TelegramBotsApi;
import org.telegram.telegrambots.meta.exceptions.TelegramApiException;
import org.telegram.telegrambots.updatesreceivers.DefaultBotSession;

public class Main {
    public static void main(String[] args) {
        try {
            TelegramBotsApi botsApi = new TelegramBotsApi(DefaultBotSession.class);
            botsApi.registerBot(new PaymentTelegramBot());
            System.out.println("✅ Bot Started Successfully!");
        } catch (TelegramApiException e) {
            System.out.println("❌ An error occurred. Bot Didn't Start!");
            e.printStackTrace();
        }
    }
}
