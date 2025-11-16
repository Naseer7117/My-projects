package com.tammudu.files;
import com.tammudu.config.ConfigLoader;
import com.tammudu.managers.AdminManager;
import com.tammudu.managers.BinManager;
import com.tammudu.managers.UserManager;
import com.tammudu.cmds.UpdateHandler;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.Objects;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.atomic.AtomicInteger;

import org.telegram.telegrambots.bots.TelegramLongPollingBot;
import org.telegram.telegrambots.bots.DefaultBotOptions;
import org.telegram.telegrambots.meta.api.methods.send.SendDocument;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.api.objects.InputFile;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.exceptions.TelegramApiException;

public class PaymentTelegramBot extends TelegramLongPollingBot {

    private static final AtomicInteger WORKER_COUNTER = new AtomicInteger(1);
    private static final ExecutorService TASK_EXECUTOR = Executors.newFixedThreadPool(
            Math.max(4, Runtime.getRuntime().availableProcessors() * 2),
            new BotThreadFactory());

    static {
        Runtime.getRuntime().addShutdownHook(new Thread(() -> TASK_EXECUTOR.shutdown()));
    }

    private static final String BOT_USERNAME = requireCredential("bot.username", "BOT_USERNAME", "Telegram bot username");
    private static final String BOT_TOKEN = requireCredential("bot.token", "BOT_TOKEN", "Telegram bot token");

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

    public void runAsync(Runnable task) {
        Objects.requireNonNull(task, "task");
        TASK_EXECUTOR.execute(task);
    }

    public void sendDocument(Long chatId, String fileName, String content) {
        SendDocument document = new SendDocument();
        document.setChatId(chatId.toString());
        byte[] bytes = content.getBytes(StandardCharsets.UTF_8);
        document.setDocument(new InputFile(new ByteArrayInputStream(bytes), fileName));
        try {
            execute(document);
        } catch (TelegramApiException e) {
            e.printStackTrace();
        }
    }

    private static final class BotThreadFactory implements ThreadFactory {
        @Override
        public Thread newThread(Runnable runnable) {
            Thread thread = new Thread(runnable, "bot-worker-" + WORKER_COUNTER.getAndIncrement());
            thread.setDaemon(true);
            return thread;
        }
    }

    private static String requireCredential(String propertyKey, String envKey, String displayName) {
        String value = ConfigLoader.getOrEnv(propertyKey, envKey);
        if (value == null || value.isBlank()) {
            throw new IllegalStateException(displayName + " is not configured. "
                    + "Set it in config.properties or via the " + envKey + " environment variable.");
        }
        return value.trim();
    }
}
