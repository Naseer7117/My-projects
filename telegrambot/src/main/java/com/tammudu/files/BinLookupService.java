package com.tammudu.files;

import java.io.IOException;
import java.time.Duration;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
/**
 * Simple BIN lookup service using the public Binlist API.
 * Keeps all logic isolated in a single class.
 *
 * API: https://lookup.binlist.net/{bin}
 * Terms: Use responsibly. Subject to Binlist's fair use limits.
 */
public class BinLookupService {

    private static final OkHttpClient CLIENT = new OkHttpClient.Builder()
            .callTimeout(Duration.ofSeconds(10))
            .build();

    private static final ObjectMapper MAPPER = new ObjectMapper();

    public static String lookup(String rawBin) {
        String bin = (rawBin == null) ? "" : rawBin.replaceAll("[^0-9]", "");
        if (bin.length() < 6 || bin.length() > 12) {
            return "❗ Please provide a valid BIN (6–12 digits). Example: `/bin 411911`";
        }

        String url = "https://lookup.binlist.net/" + bin;

        Request req = new Request.Builder()
                .url(url)
                .addHeader("Accept", "application/json")
                .addHeader("User-Agent", "TelegramBot-BIN-Lookup/1.0 (+https://t.me/)")
                .build();

        try (Response res = CLIENT.newCall(req).execute()) {
            if (!res.isSuccessful()) {
                if (res.code() == 404) {
                    return "❌ No data found for BIN `" + bin + "`.";
                } else if (res.code() == 429) {
                    return "⏳ Rate limit reached. Please try again in a minute.";
                }
                return "⚠️ Lookup failed (HTTP " + res.code() + ").";
            }

            String body = res.body().string();
            JsonNode root = MAPPER.readTree(body);

            StringBuilder sb = new StringBuilder();
            sb.append("*BIN Lookup* \\(`").append(bin).append("`\\)\n");

            // top-level
            append(sb, "Scheme", getText(root, "scheme"));
            append(sb, "Brand", getText(root, "brand"));
            append(sb, "Type", getText(root, "type"));
            append(sb, "Prepaid", getBool(root, "prepaid"));

            // number.*
            JsonNode number = root.path("number");
            append(sb, "Length", number.path("length").isInt() ? String.valueOf(number.path("length").asInt()) : "");
            append(sb, "Luhn", number.path("luhn").isBoolean() ? String.valueOf(number.path("luhn").asBoolean()) : "");

            // country.*
            JsonNode country = root.path("country");
            String countryLine = joinNonEmpty(
                getText(country, "name"),
                getText(country, "emoji"),
                getText(country, "currency")
            );
            append(sb, "Country", countryLine);

            // bank.*
            JsonNode bank = root.path("bank");
            append(sb, "Bank", getText(bank, "name"));
            append(sb, "Bank URL", getText(bank, "url"));
            append(sb, "Bank Phone", getText(bank, "phone"));
            append(sb, "Bank City", getText(bank, "city"));

            String out = sb.toString().replaceAll("(?m)^[^:]*:\\s*$", ""); // drop empty lines
            return out.trim().isEmpty() ? "ℹ️ No details available for `" + bin + "`." : out;
        } catch (IOException e) {
            return "⚠️ Network error while looking up BIN. " + e.getMessage();
        }
    }

    private static void append(StringBuilder sb, String label, String value) {
        if (value != null && !value.isBlank()) {
            sb.append("\n*").append(escape(label)).append(":* ").append(escape(value));
        }
    }

    private static String joinNonEmpty(String... parts) {
        StringBuilder sb = new StringBuilder();
        for (String p : parts) {
            if (p != null && !p.isBlank()) {
                if (sb.length() > 0) sb.append(" · ");
                sb.append(p);
            }
        }
        return sb.toString();
    }

    private static String getText(JsonNode node, String field) {
        JsonNode v = node.path(field);
        if (v.isMissingNode() || v.isNull()) return "";
        return v.isTextual() ? v.asText() : v.toString();
    }

    private static String getBool(JsonNode node, String field) {
        JsonNode v = node.path(field);
        if (v.isMissingNode() || v.isNull() || !v.isBoolean()) return "";
        return v.asBoolean() ? "yes" : "no";
    }

    // Escape a subset of Markdown V2 to keep things simple
    private static String escape(String s) {
        return s.replace("_", "\\_")
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
}
