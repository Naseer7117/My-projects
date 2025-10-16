package com.tammudu.managers;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public final class ConversationHistoryManager {

    private static final int MAX_ENTRIES = 8;
    private static final Map<Long, Deque<Entry>> HISTORY = new ConcurrentHashMap<>();

    private ConversationHistoryManager() {
    }

    public static void recordUserMessage(Long chatId, String text) {
        append(chatId, Role.USER, text);
    }

    public static void recordAssistantMessage(Long chatId, String text) {
        append(chatId, Role.ASSISTANT, text);
    }

    public static List<Entry> getRecentHistory(Long chatId) {
        Deque<Entry> deque = HISTORY.get(chatId);
        if (deque == null) {
            return List.of();
        }
        synchronized (deque) {
            return List.copyOf(deque);
        }
    }

    public static void clear(Long chatId) {
        Deque<Entry> deque = HISTORY.remove(chatId);
        if (deque != null) {
            synchronized (deque) {
                deque.clear();
            }
        }
    }

    private static void append(Long chatId, Role role, String rawText) {
        if (chatId == null || rawText == null) {
            return;
        }
        String text = rawText.trim();
        if (text.isEmpty()) {
            return;
        }
        Deque<Entry> deque = HISTORY.computeIfAbsent(chatId, id -> new ArrayDeque<>());
        synchronized (deque) {
            deque.addLast(new Entry(role, text));
            while (deque.size() > MAX_ENTRIES) {
                deque.removeFirst();
            }
        }
    }

    public enum Role {
        USER("user"),
        ASSISTANT("model");

        private final String apiRole;

        Role(String apiRole) {
            this.apiRole = apiRole;
        }

        public String apiRole() {
            return apiRole;
        }
    }

    public record Entry(Role role, String text) { }
}
