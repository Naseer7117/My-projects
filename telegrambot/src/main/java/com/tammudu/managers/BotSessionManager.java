package com.tammudu.managers;

import java.util.concurrent.ConcurrentHashMap;

import com.tammudu.files.CardGenerator;

public class BotSessionManager {
    private static final ConcurrentHashMap<Long, Boolean> expectingCardStartDigit = new ConcurrentHashMap<>();
    private static final ConcurrentHashMap<Long, Boolean> expectingGeneratorExpiry = new ConcurrentHashMap<>();
    private static final ConcurrentHashMap<Long, Boolean> expectingGeneratorQuantity = new ConcurrentHashMap<>();
    private static final ConcurrentHashMap<Long, String> pendingGeneratorBins = new ConcurrentHashMap<>();
    private static final ConcurrentHashMap<Long, CardGenerator.ExpirySpec> pendingGeneratorExpiry = new ConcurrentHashMap<>();

    public static void setExpectingCardStartDigit(Long chatId, boolean value) {
        if (value) {
            expectingCardStartDigit.put(chatId, Boolean.TRUE);
        } else {
            expectingCardStartDigit.remove(chatId);
        }
    }

    public static boolean isExpectingCardStartDigit(Long chatId) {
        return expectingCardStartDigit.containsKey(chatId);
    }

    public static void setPendingGeneratorBin(Long chatId, String bin) {
        if (bin == null) {
            pendingGeneratorBins.remove(chatId);
        } else {
            pendingGeneratorBins.put(chatId, bin);
        }
    }

    public static String getPendingGeneratorBin(Long chatId) {
        return pendingGeneratorBins.get(chatId);
    }

    public static void setExpectingGeneratorExpiry(Long chatId, boolean value) {
        if (value) {
            expectingGeneratorExpiry.put(chatId, Boolean.TRUE);
        } else {
            expectingGeneratorExpiry.remove(chatId);
        }
    }

    public static boolean isExpectingGeneratorExpiry(Long chatId) {
        return expectingGeneratorExpiry.containsKey(chatId);
    }

    public static void setPendingGeneratorExpiry(Long chatId, CardGenerator.ExpirySpec spec) {
        if (spec == null) {
            pendingGeneratorExpiry.remove(chatId);
        } else {
            pendingGeneratorExpiry.put(chatId, spec);
        }
    }

    public static CardGenerator.ExpirySpec getPendingGeneratorExpiry(Long chatId) {
        return pendingGeneratorExpiry.get(chatId);
    }

    public static void setExpectingGeneratorQuantity(Long chatId, boolean value) {
        if (value) {
            expectingGeneratorQuantity.put(chatId, Boolean.TRUE);
        } else {
            expectingGeneratorQuantity.remove(chatId);
        }
    }

    public static boolean isExpectingGeneratorQuantity(Long chatId) {
        return expectingGeneratorQuantity.containsKey(chatId);
    }

    public static void clearGeneratorState(Long chatId) {
        expectingGeneratorExpiry.remove(chatId);
        expectingGeneratorQuantity.remove(chatId);
        pendingGeneratorBins.remove(chatId);
        pendingGeneratorExpiry.remove(chatId);
    }

    public static void resetSession(Long chatId) {
        expectingCardStartDigit.remove(chatId);
        clearGeneratorState(chatId);
        // This resets all the sessions and make to idle state.
    }
}
