package com.tammudu.files;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.charset.StandardCharsets;
import java.io.IOException;
import java.time.LocalDateTime;
import java.nio.file.StandardOpenOption;

public class BotLogger {

    private static final String LOG_FILE = "bot_actions.log";

    public static void logAction(String logEntry) {
        try {
            String timestamp = LocalDateTime.now().toString();
            String fullEntry = "[" + timestamp + "] " + logEntry;
            Files.writeString(
                Path.of(LOG_FILE),
                fullEntry + System.lineSeparator(),
                StandardCharsets.UTF_8,
                StandardOpenOption.CREATE,
                StandardOpenOption.APPEND
            );
        } catch (IOException e) {
            System.out.println("Error writing to bot_actions.log: " + e.getMessage());
        }
    }
}
