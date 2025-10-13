package com.tammudu.chat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.tammudu.config.ConfigLoader;
import com.tammudu.config.Proxies;
import com.tammudu.config.Proxies.ProxyInfo;
import okhttp3.Authenticator;
import okhttp3.ConnectionPool;
import okhttp3.Credentials;
import okhttp3.Dispatcher;
import okhttp3.HttpUrl;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.Proxy;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.TimeUnit;

public final class GeminiChatService {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final MediaType JSON_MEDIA_TYPE = MediaType.parse("application/json; charset=utf-8");
    private static final Duration HTTP_TIMEOUT = Duration.ofSeconds(10);
    private static final OkHttpClient DIRECT_CLIENT = baseClientBuilder().build();
    private static final Map<String, OkHttpClient> PROXY_CLIENT_CACHE = new ConcurrentHashMap<>();
    private static final int MAX_REQUESTS = 512;
    private static final int MAX_REQUESTS_PER_HOST = 128;
    private static final int CONNECTION_POOL_SIZE = 128;
    private static final int MAX_ATTEMPTS_PER_ROUTE = 2;
    private static final long RETRY_BASE_DELAY_MILLIS = 200;

    private GeminiChatService() {
    }

    public static boolean isConfigured() {
        String apiKey = resolveApiKey();
        return apiKey != null && !apiKey.isEmpty();
    }

    public static String generateReply(String userMessage, String firstName) throws IOException {
        String apiKey = resolveApiKey();
        if (apiKey == null || apiKey.isEmpty()) {
            throw new IllegalStateException("Gemini API key is not configured.");
        }

        HttpUrl baseUrl = HttpUrl.parse(resolveApiUrl());
        if (baseUrl == null) {
            throw new IOException("Gemini API URL is invalid.");
        }
        HttpUrl url = baseUrl.newBuilder()
                .addQueryParameter("key", apiKey)
                .build();

        String prompt = buildPrompt(userMessage, firstName);

        ObjectNode payload = MAPPER.createObjectNode();
        ArrayNode contents = payload.putArray("contents");
        ObjectNode content = contents.addObject();
        ArrayNode parts = content.putArray("parts");
        parts.addObject().put("text", prompt);

        ObjectNode generationConfig = payload.putObject("generationConfig");
        generationConfig.put("temperature", resolveTemperature());
        generationConfig.put("maxOutputTokens", resolveMaxOutputTokens());

        RequestBody body = RequestBody.create(MAPPER.writeValueAsString(payload), JSON_MEDIA_TYPE);
        Request request = new Request.Builder()
                .url(url)
                .addHeader("Content-Type", "application/json")
                .post(body)
                .build();

        List<ClientCandidate> candidates = buildClientCandidates();
        IOException lastNetworkError = null;

        for (ClientCandidate candidate : candidates) {
            for (int attempt = 0; attempt < MAX_ATTEMPTS_PER_ROUTE; attempt++) {
                try (Response response = candidate.client.newCall(request).execute()) {
                    String responseText = response.body() != null ? response.body().string() : "";
                    if (!response.isSuccessful()) {
                        String message = "Gemini request failed (HTTP " + response.code() + " via " + candidate.identityKey + ")";
                        if (shouldRetry(response.code())) {
                            lastNetworkError = new IOException(message + ": " + truncate(responseText));
                            sleepWithBackoff(attempt);
                            continue;
                        }
                        throw new IOException(message + ": " + truncate(responseText));
                    }
                    if (responseText.isBlank()) {
                        throw new IOException("Gemini response body is empty via " + candidate.identityKey + ".");
                    }

                    return extractContent(responseText);
                } catch (IOException networkError) {
                    lastNetworkError = networkError;
                    sleepWithBackoff(attempt);
                }
            }
        }

        if (lastNetworkError != null) {
            throw new IOException("Gemini request failed via all available routes: " + lastNetworkError.getMessage(), lastNetworkError);
        }
        throw new IOException("Gemini request failed for an unknown reason.");
    }

    private static String buildPrompt(String userMessage, String firstName) {
        String systemPrompt = resolveSystemPrompt();
        StringBuilder prompt = new StringBuilder();
        if (systemPrompt != null && !systemPrompt.isBlank()) {
            prompt.append(systemPrompt.trim()).append("\n\n");
        }
        if (firstName != null && !firstName.isBlank()) {
            prompt.append(firstName.trim()).append(" says: ");
        }
        prompt.append(userMessage);
        return prompt.toString();
    }

    private static String resolveApiKey() {
        String raw = ConfigLoader.getOrEnv("gemini.apiKey", "GEMINI_API_KEY");
        return raw == null ? null : raw.trim();
    }

    private static String resolveApiUrl() {
        String raw = ConfigLoader.getOrDefault("gemini.apiUrl",
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent");
        return raw == null ? "" : raw.trim();
    }

    private static String resolveSystemPrompt() {
        String raw = ConfigLoader.getOrDefault(
                "gemini.systemPrompt",
                "You are a friendly assistant for a Telegram bot. Respond concisely and stay helpful.");
        return raw == null ? "" : raw.trim();
    }

    private static double resolveTemperature() {
        String raw = ConfigLoader.getOrDefault("gemini.temperature", "0.7");
        try {
            return Double.parseDouble(raw.trim());
        } catch (NumberFormatException ex) {
            return 0.7;
        }
    }

    private static int resolveMaxOutputTokens() {
        String raw = ConfigLoader.getOrDefault("gemini.maxOutputTokens", "300");
        try {
            return Integer.parseInt(raw.trim());
        } catch (NumberFormatException ex) {
            return 300;
        }
    }

    private static boolean shouldRetry(int statusCode) {
        return statusCode == 429 || (statusCode >= 500 && statusCode < 600);
    }

    private static void sleepWithBackoff(int attempt) {
        long base = RETRY_BASE_DELAY_MILLIS * (1L << Math.min(attempt, 6));
        long jitter = ThreadLocalRandom.current().nextLong(RETRY_BASE_DELAY_MILLIS);
        sleepQuietly(base + jitter);
    }

    private static void sleepQuietly(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException ignored) {
            Thread.currentThread().interrupt();
        }
    }

    private static String extractContent(String responseText) throws IOException {
        JsonNode root = MAPPER.readTree(responseText);
        JsonNode candidates = root.path("candidates");
        if (!candidates.isArray() || candidates.size() == 0) {
            throw new IOException("Gemini response missing candidates.");
        }

        for (JsonNode candidate : candidates) {
            String extracted = extractFromCandidate(candidate);
            if (extracted != null && !extracted.isBlank()) {
                return extracted.trim();
            }
        }

        JsonNode firstCandidate = candidates.get(0);
        String finishReason = firstCandidate.path("finishReason").asText("");
        if ("SAFETY".equalsIgnoreCase(finishReason)) {
            return "I’m sorry, but I can’t help with that request.";
        }

        String rawText = firstCandidate.path("text").asText("");
        if (!rawText.isBlank()) {
            return rawText.trim();
        }

        throw new IOException("Gemini returned no textual content (finishReason=" + finishReason + ")");
    }

    private static String extractFromCandidate(JsonNode candidate) {
        if (candidate == null) {
            return null;
        }
        StringBuilder builder = new StringBuilder();

        JsonNode content = candidate.path("content");
        JsonNode parts = content.path("parts");
        if (parts.isArray()) {
            for (JsonNode part : parts) {
                String text = part.path("text").asText("");
                if (!text.isBlank()) {
                    if (builder.length() > 0) {
                        builder.append("\n\n");
                    }
                    builder.append(text.trim());
                } else if (part.has("functionCall")) {
                    JsonNode fn = part.path("functionCall");
                    String name = fn.path("name").asText("function");
                    String args = fn.path("args").toString();
                    if (builder.length() > 0) {
                        builder.append("\n\n");
                    }
                    builder.append("Function call: ").append(name).append(" ").append(args);
                }
            }
        }

        if (builder.length() > 0) {
            return builder.toString();
        }

        String textField = candidate.path("text").asText("");
        if (!textField.isBlank()) {
            return textField;
        }

        JsonNode grounded = candidate.path("groundingMetadata").path("webSearchQueries");
        if (grounded.isArray() && grounded.size() > 0) {
            return grounded.toString();
        }

        return null;
    }

    private static List<ClientCandidate> buildClientCandidates() {
        List<ClientCandidate> clients = new ArrayList<>();
        if (Proxies.isProxyEnabled()) {
            List<ProxyInfo> proxies = new ArrayList<>(Proxies.loadProxies());
            if (!proxies.isEmpty()) {
                Collections.shuffle(proxies);
                for (ProxyInfo proxyInfo : proxies) {
                    String key = proxyKey(proxyInfo);
                    clients.add(new ClientCandidate(key, getClientForProxy(proxyInfo)));
                }
            }
        }
        clients.add(new ClientCandidate("direct", DIRECT_CLIENT));
        return clients;
    }

    private static OkHttpClient getClientForProxy(ProxyInfo proxyInfo) {
        Objects.requireNonNull(proxyInfo, "proxyInfo");
        String key = proxyKey(proxyInfo);
        return PROXY_CLIENT_CACHE.computeIfAbsent(key, k -> {
            OkHttpClient.Builder builder = baseClientBuilder()
                    .proxy(new Proxy(Proxy.Type.HTTP, new InetSocketAddress(proxyInfo.host, proxyInfo.port)));
            if (proxyInfo.username != null && !proxyInfo.username.isBlank()) {
                builder.proxyAuthenticator(buildAuthenticator(proxyInfo));
            }
            return builder.build();
        });
    }

    private static Authenticator buildAuthenticator(ProxyInfo proxyInfo) {
        return (route, response) -> {
            if (response.request().header("Proxy-Authorization") != null) {
                return null;
            }
            String credential = Credentials.basic(
                    proxyInfo.username,
                    proxyInfo.password == null ? "" : proxyInfo.password
            );
            return response.request().newBuilder()
                    .header("Proxy-Authorization", credential)
                    .build();
        };
    }

    private static OkHttpClient.Builder baseClientBuilder() {
        Dispatcher dispatcher = new Dispatcher();
        dispatcher.setMaxRequests(MAX_REQUESTS);
        dispatcher.setMaxRequestsPerHost(MAX_REQUESTS_PER_HOST);

        return new OkHttpClient.Builder()
                .dispatcher(dispatcher)
                .connectionPool(new ConnectionPool(CONNECTION_POOL_SIZE, 5, TimeUnit.MINUTES))
                .callTimeout(HTTP_TIMEOUT)
                .connectTimeout(HTTP_TIMEOUT)
                .readTimeout(HTTP_TIMEOUT)
                .writeTimeout(HTTP_TIMEOUT)
                .retryOnConnectionFailure(true);
    }

    private static String truncate(String value) {
        if (value == null) {
            return "";
        }
        String trimmed = value.trim();
        if (trimmed.length() <= 300) {
            return trimmed;
        }
        return trimmed.substring(0, 297) + "...";
    }

    private static String proxyKey(ProxyInfo proxyInfo) {
        return proxyInfo.host + ":" + proxyInfo.port;
    }

    private record ClientCandidate(String identityKey, OkHttpClient client) { }
}
