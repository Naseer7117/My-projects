package com.tammudu.files;

import com.sun.net.httpserver.Headers;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;
import com.tammudu.config.ConfigLoader;
import org.telegram.telegrambots.meta.TelegramBotsApi;
import org.telegram.telegrambots.meta.exceptions.TelegramApiException;
import org.telegram.telegrambots.updatesreceivers.DefaultBotSession;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class Main {

    private static final String DEFAULT_PORT = "7000";

    public static void main(String[] args) {
        ServerHolder serverHolder = null;
        try {
            serverHolder = startStatusServer();
            TelegramBotsApi botsApi = new TelegramBotsApi(DefaultBotSession.class);
            botsApi.registerBot(new PaymentTelegramBot());
            System.out.println("���o. Bot Started Successfully!");
        } catch (IOException e) {
            System.out.println("���?O Failed to start HTTP status server on the configured port!");
            e.printStackTrace();
        } catch (TelegramApiException e) {
            System.out.println("���?O An error occurred. Bot Didn't Start!");
            e.printStackTrace();
            if (serverHolder != null) {
                serverHolder.stop();
            }
        }
    }

    private static ServerHolder startStatusServer() throws IOException {
        int port = parsePort(ConfigLoader.getOrDefault("server.port", DEFAULT_PORT));
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
        server.createContext("/", new StatusHandler());
        ExecutorService executor = Executors.newSingleThreadExecutor(r -> {
            Thread t = new Thread(r, "bot-http-server");
            t.setDaemon(true);
            return t;
        });
        server.setExecutor(executor);
        server.start();
        System.out.println("Local status endpoint listening on port " + port);
        return new ServerHolder(server, executor);
    }

    private static int parsePort(String rawValue) {
        if (rawValue == null || rawValue.isBlank()) {
            return Integer.parseInt(DEFAULT_PORT);
        }
        try {
            int parsed = Integer.parseInt(rawValue.trim());
            if (parsed <= 0 || parsed > 65535) {
                throw new IllegalArgumentException("Port must be between 1 and 65535");
            }
            return parsed;
        } catch (NumberFormatException ex) {
            System.out.println("Invalid server.port value '" + rawValue + "', defaulting to " + DEFAULT_PORT);
            return Integer.parseInt(DEFAULT_PORT);
        } catch (IllegalArgumentException ex) {
            System.out.println("Invalid server.port value '" + rawValue + "', defaulting to " + DEFAULT_PORT);
            return Integer.parseInt(DEFAULT_PORT);
        }
    }

    private static final class ServerHolder {
        private final HttpServer server;
        private final ExecutorService executor;

        private ServerHolder(HttpServer server, ExecutorService executor) {
            this.server = server;
            this.executor = executor;
        }

        private void stop() {
            server.stop(0);
            executor.shutdownNow();
        }
    }

    private static final class StatusHandler implements HttpHandler {
        private static final byte[] BODY = "Telegram bot is running."
                .getBytes(StandardCharsets.UTF_8);

        @Override
        public void handle(HttpExchange exchange) throws IOException {
            try (OutputStream os = exchange.getResponseBody()) {
                Headers headers = exchange.getResponseHeaders();
                headers.add("Content-Type", "text/plain; charset=utf-8");
                exchange.sendResponseHeaders(200, BODY.length);
                os.write(BODY);
            } finally {
                exchange.close();
            }
        }
    }
}
