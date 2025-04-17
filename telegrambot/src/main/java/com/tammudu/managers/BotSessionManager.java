package com.tammudu.managers;

import java.util.concurrent.ConcurrentHashMap;

public class BotSessionManager {
    private static final ConcurrentHashMap<Long, Boolean> expectingCardStartDigit = new ConcurrentHashMap<>();

    public static void setExpectingCardStartDigit(Long chatId, boolean value) {
        expectingCardStartDigit.put(chatId, value);
    }

    public static boolean isExpectingCardStartDigit(Long chatId) {
        return expectingCardStartDigit.getOrDefault(chatId, false);
    }
    public static void resetSession(Long chatId) {
        expectingCardStartDigit.remove(chatId);
        // This resets all the sessions and make to idle state.
    }
}
