package com.tammudu.logs;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ThreadFactory;

public final class BotLogger {

    private static final Path LOG_FILE = Path.of("bot_actions.log");
    private static final ExecutorService EXECUTOR;

    static {
        ThreadFactory factory = runnable -> {
            Thread t = new Thread(runnable, "bot-logger");
            t.setDaemon(true);
            return t;
        };
        EXECUTOR = Executors.newSingleThreadExecutor(factory);
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            EXECUTOR.shutdown();
        }));
    }

    private BotLogger() {
        // Utility class
    }

    public static void logAction(String logEntry) {
        Objects.requireNonNull(logEntry, "logEntry");
        EXECUTOR.execute(() -> persistLog(logEntry));
    }

    private static void persistLog(String logEntry) {
        Path parent = LOG_FILE.toAbsolutePath().getParent();
        if (parent != null) {
            try {
                Files.createDirectories(parent);
            } catch (IOException ignored) {
                // If we can't ensure parent directories exist we still attempt to write.
            }
        }

        String timestamp = LocalDateTime.now().toString();
        String fullEntry = "[" + timestamp + "] " + logEntry;
        try {
            Files.writeString(
                    LOG_FILE,
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
