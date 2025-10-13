package com.tammudu.services;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.Proxy;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Deque;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import okhttp3.Authenticator;
import okhttp3.Credentials;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tammudu.config.Proxies;
import com.tammudu.config.Proxies.ProxyInfo;

/**
 * BIN lookup service with simple caching, proxy rotation, and automatic retry logic.
 * This helps soften external rate limits so a single user can run many lookups quickly.
 */
public class BinLookupService {

    private static final Duration HTTP_TIMEOUT = Duration.ofSeconds(10);
    private static final Duration CACHE_TTL = Duration.ofMinutes(45);
    private static final int CACHE_MAX_SIZE = 1000;
    private static final int MAX_TOTAL_ATTEMPTS = 6;
    private static final int RETRY_DELAY_STEP_MILLIS = 250;
    private static final int PER_IDENTITY_REQUEST_LIMIT = 5;
    private static final Duration PER_IDENTITY_WINDOW = Duration.ofMinutes(1);

    private static final OkHttpClient DIRECT_CLIENT = baseClientBuilder().build();
    private static final Map<String, OkHttpClient> PROXY_CLIENT_CACHE = new ConcurrentHashMap<>();
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final Map<String, CacheEntry> CACHE = new ConcurrentHashMap<>();
    private static final ConcurrentLinkedQueue<String> CACHE_ORDER = new ConcurrentLinkedQueue<>();
    private static final Map<String, Deque<Instant>> REQUEST_TIMELINES = new ConcurrentHashMap<>();
    private static final Map<String, String> REQUESTER_PROXY_ASSIGNMENTS = new ConcurrentHashMap<>();
    private static final AtomicInteger REQUESTER_ASSIGNMENT_CURSOR = new AtomicInteger();

    public static String lookup(String rawBin, String requesterKey) {
        String bin = (rawBin == null) ? "" : rawBin.replaceAll("[^0-9]", "");
        if (bin.length() < 6 || bin.length() > 12) {
            return "Please provide a valid BIN (6-12 digits). Example: `/bin 411911`";
        }

        String normalizedRequesterKey = normalizeRequesterKey(requesterKey);

        CacheEntry cached = CACHE.get(bin);
        if (cached != null) {
            if (cached.isFresh()) {
                return cached.response;
            }
            CACHE.remove(bin);
        }

        List<ClientCandidate> clients = buildClientRotation(normalizedRequesterKey);
        if (clients.isEmpty()) {
            clients = Collections.singletonList(new ClientCandidate("direct", DIRECT_CLIENT));
        }

        Request request = new Request.Builder()
                .url("https://lookup.binlist.net/" + bin)
                .addHeader("Accept", "application/json")
                .addHeader("User-Agent", "TelegramBot-BIN-Lookup/1.1 (+https://t.me/)")
                .build();

        IOException lastIoException = null;
        String rateLimitMessage = null;

        int attempt = 0;
        for (ClientCandidate candidate : clients) {
            if (attempt >= MAX_TOTAL_ATTEMPTS) {
                break;
            }
            attempt++;

            throttleIfNeeded(candidate.identityKey());

            try (Response response = candidate.client.newCall(request).execute()) {
                registerCall(candidate.identityKey());

                if (!response.isSuccessful()) {
                    if (response.code() == 404) {
                        return "No data found for BIN `" + bin + "`.";
                    } else if (response.code() == 429) {
                        rateLimitMessage = "Rate limit reached on " + candidate.identityKey() + ". Trying another route...";
                        sleepQuietly(RETRY_DELAY_STEP_MILLIS * attempt);
                        continue;
                    }
                    rateLimitMessage = "Lookup failed (HTTP " + response.code() + ").";
                    continue;
                }

                String body = Objects.requireNonNull(response.body()).string();
                String formatted = formatResponse(bin, body);
                cache(bin, formatted);
                return formatted;
            } catch (IOException ioe) {
                lastIoException = ioe;
                sleepQuietly(RETRY_DELAY_STEP_MILLIS * attempt);
            }
        }

        if (rateLimitMessage != null) {
            return rateLimitMessage + "\nPlease wait a few seconds or add more proxies to `proxies.txt`.";
        }
        if (lastIoException != null) {
            return "Network error while looking up BIN. " + lastIoException.getMessage();
        }
        return "BIN lookup failed. Please try again shortly.";
    }

    private static String formatResponse(String bin, String rawJson) throws IOException {
        JsonNode root = MAPPER.readTree(rawJson);

        StringBuilder sb = new StringBuilder();
        sb.append("*BIN Lookup* \\(`").append(bin).append("`\\)\n");

        append(sb, "Scheme", getText(root, "scheme"));
        append(sb, "Brand", getText(root, "brand"));
        append(sb, "Type", getText(root, "type"));
        append(sb, "Prepaid", getBool(root, "prepaid"));

        JsonNode number = root.path("number");
        append(sb, "Length", number.path("length").isInt() ? String.valueOf(number.path("length").asInt()) : "");
        append(sb, "Luhn", number.path("luhn").isBoolean() ? String.valueOf(number.path("luhn").asBoolean()) : "");

        JsonNode country = root.path("country");
        String countryLine = joinNonEmpty(
                getText(country, "name"),
                getText(country, "emoji"),
                getText(country, "currency")
        );
        append(sb, "Country", countryLine);

        JsonNode bank = root.path("bank");
        append(sb, "Bank", getText(bank, "name"));
        append(sb, "Bank URL", getText(bank, "url"));
        append(sb, "Bank Phone", getText(bank, "phone"));
        append(sb, "Bank City", getText(bank, "city"));

        String out = sb.toString().replaceAll("(?m)^[^:]*:\\s*$", "");
        return out.trim().isEmpty() ? "No details available for `" + bin + "`." : out;
    }

    private static void append(StringBuilder sb, String label, String value) {
        if (value != null && !value.isBlank()) {
            sb.append("\n*").append(escape(label)).append(":* ").append(escape(value));
        }
    }

    private static String joinNonEmpty(String... parts) {
        StringBuilder sb = new StringBuilder();
        for (String part : parts) {
            if (part != null && !part.isBlank()) {
                if (sb.length() > 0) {
                    sb.append(" | ");
                }
                sb.append(part);
            }
        }
        return sb.toString();
    }

    private static String getText(JsonNode node, String field) {
        JsonNode value = node.path(field);
        if (value.isMissingNode() || value.isNull()) {
            return "";
        }
        return value.isTextual() ? value.asText() : value.toString();
    }

    private static String getBool(JsonNode node, String field) {
        JsonNode value = node.path(field);
        if (value.isMissingNode() || value.isNull() || !value.isBoolean()) {
            return "";
        }
        return value.asBoolean() ? "yes" : "no";
    }

    private static void cache(String bin, String response) {
        CACHE.put(bin, new CacheEntry(response));
        CACHE_ORDER.add(bin);
        while (CACHE.size() > CACHE_MAX_SIZE) {
            String oldest = CACHE_ORDER.poll();
            if (oldest == null) {
                break;
            }
            CACHE.remove(oldest);
        }
    }

    private static void throttleIfNeeded(String identityKey) {
        if (identityKey == null) {
            return;
        }
        Deque<Instant> timeline = REQUEST_TIMELINES.computeIfAbsent(identityKey, k -> new ArrayDeque<>());
        Instant now = Instant.now();
        synchronized (timeline) {
            pruneOldEntries(timeline, now);
            if (timeline.size() >= PER_IDENTITY_REQUEST_LIMIT) {
                Instant oldest = timeline.peekFirst();
                if (oldest != null) {
                    long waitMillis = PER_IDENTITY_WINDOW.minus(Duration.between(oldest, now)).toMillis();
                    if (waitMillis > 0) {
                        sleepQuietly(Math.min(waitMillis, 750));
                    }
                }
            }
        }
    }

    private static void registerCall(String identityKey) {
        if (identityKey == null) {
            return;
        }
        Deque<Instant> timeline = REQUEST_TIMELINES.computeIfAbsent(identityKey, k -> new ArrayDeque<>());
        Instant now = Instant.now();
        synchronized (timeline) {
            pruneOldEntries(timeline, now);
            timeline.addLast(now);
        }
    }

    private static void pruneOldEntries(Deque<Instant> timeline, Instant now) {
        while (!timeline.isEmpty()) {
            Instant head = timeline.peekFirst();
            if (head == null) {
                break;
            }
            if (Duration.between(head, now).compareTo(PER_IDENTITY_WINDOW) > 0) {
                timeline.removeFirst();
            } else {
                break;
            }
        }
    }

    private static void sleepQuietly(long millis) {
        if (millis <= 0) {
            return;
        }
        try {
            TimeUnit.MILLISECONDS.sleep(millis);
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
        }
    }

    private static List<ClientCandidate> buildClientRotation(String requesterKey) {
        String key = normalizeRequesterKey(requesterKey);
        if (!Proxies.isProxyEnabled()) {
            REQUESTER_PROXY_ASSIGNMENTS.remove(key);
            return Collections.singletonList(new ClientCandidate("direct", DIRECT_CLIENT));
        }

        List<ProxyInfo> proxies = Proxies.loadProxies();
        if (proxies.isEmpty()) {
            REQUESTER_PROXY_ASSIGNMENTS.remove(key);
            return Collections.singletonList(new ClientCandidate("direct", DIRECT_CLIENT));
        }

        ProxyInfo assignedProxy = resolveAssignedProxy(proxies, key);
        List<ClientCandidate> candidates = new ArrayList<>();

        String assignedKey = null;
        if (assignedProxy != null) {
            assignedKey = proxyKey(assignedProxy);
            candidates.add(new ClientCandidate(assignedKey, getClientForProxy(assignedProxy)));
        }

        for (ProxyInfo proxyInfo : proxies) {
            String proxyKeyValue = proxyKey(proxyInfo);
            if (assignedKey != null && proxyKeyValue.equals(assignedKey)) {
                continue;
            }
            candidates.add(new ClientCandidate(proxyKeyValue, getClientForProxy(proxyInfo)));
            if (candidates.size() >= MAX_TOTAL_ATTEMPTS - 1) {
                break;
            }
        }

        candidates.add(new ClientCandidate("direct", DIRECT_CLIENT));
        return candidates;
    }

    private static ProxyInfo resolveAssignedProxy(List<ProxyInfo> proxies, String requesterKey) {
        ProxyInfo current = findProxyByKey(proxies, REQUESTER_PROXY_ASSIGNMENTS.get(requesterKey));
        if (current != null) {
            return current;
        }
        if (proxies.isEmpty()) {
            return null;
        }
        ProxyInfo selected = proxies.get(Math.floorMod(REQUESTER_ASSIGNMENT_CURSOR.getAndIncrement(), proxies.size()));
        REQUESTER_PROXY_ASSIGNMENTS.put(requesterKey, proxyKey(selected));
        return selected;
    }

    private static ProxyInfo findProxyByKey(List<ProxyInfo> proxies, String key) {
        if (key == null) {
            return null;
        }
        for (ProxyInfo proxyInfo : proxies) {
            if (proxyKey(proxyInfo).equals(key)) {
                return proxyInfo;
            }
        }
        return null;
    }

    private static OkHttpClient getClientForProxy(ProxyInfo proxyInfo) {
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
        return new OkHttpClient.Builder()
                .callTimeout(HTTP_TIMEOUT)
                .connectTimeout(HTTP_TIMEOUT)
                .readTimeout(HTTP_TIMEOUT)
                .writeTimeout(HTTP_TIMEOUT)
                .retryOnConnectionFailure(true);
    }

    private static String normalizeRequesterKey(String requesterKey) {
        if (requesterKey == null) {
            return "anonymous";
        }
        String trimmed = requesterKey.trim();
        return trimmed.isEmpty() ? "anonymous" : trimmed;
    }

    private static String proxyKey(ProxyInfo proxyInfo) {
        return proxyInfo.host + ":" + proxyInfo.port;
    }

    private static String escape(String value) {
        return value.replace("_", "\\_")
                .replace("*", "\\*")
                .replace("[", "\\[")
                .replace("]", "\\]")
                .replace("(", "\\(")
                .replace(")", "\\)")
                .replace("~", "\\~")
                .replace("`", "\\`")
                .replace(">", "\\>")
                .replace("#", "\\#")
                .replace("+", "\\+")
                .replace("-", "\\-")
                .replace("=", "\\=")
                .replace("|", "\\|")
                .replace("{", "\\{")
                .replace("}", "\\}")
                .replace(".", "\\.")
                .replace("!", "\\!");
    }

    private static class CacheEntry {
        final String response;
        final Instant storedAt;

        CacheEntry(String response) {
            this.response = Objects.requireNonNull(response);
            this.storedAt = Instant.now();
        }

        boolean isFresh() {
            return Duration.between(storedAt, Instant.now()).compareTo(CACHE_TTL) <= 0;
        }
    }

    private record ClientCandidate(String identityKey, OkHttpClient client) { }
}

