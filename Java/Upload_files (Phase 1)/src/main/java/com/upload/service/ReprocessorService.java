package com.upload.service;

import com.upload.config.ApiConfig;

import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;

public class ReprocessorService {

    public static void reprocessLMR(int bookId) {
    	System.out.println("Starting the Reprocess of LMR : ...");
        reprocessStage1(bookId);
        reprocessStage2(bookId);
    }

    private static void reprocessStage1(int bookId) {
        String urlStr = String.format(ApiConfig.REPROCESS_STAGE1_URL, bookId);
        try {
            HttpURLConnection conn = (HttpURLConnection) new URL(urlStr).openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("x-auth-code", ApiConfig.AUTH_CODE);
            conn.setRequestProperty("x-device-id", ApiConfig.DEVICE_ID);
            conn.setRequestProperty("x-user-id", ApiConfig.USER_ID);

            int responseCode = conn.getResponseCode();
            if (responseCode == 200) {
                System.out.println("✅ Reprocess Stage 1 complete for Book ID: " + bookId);
            } else {
                System.err.println("❌ Reprocess Stage 1 failed. Book ID: " + bookId + ", HTTP " + responseCode);
            }
        } catch (IOException e) {
            System.err.println("Error during Reprocess Stage 1: " + e.getMessage());
        }
    }

    private static void reprocessStage2(int bookId) {
        String urlStr = String.format(ApiConfig.REPROCESS_STAGE2_URL, bookId, "QUESTIONANDANSWER");
        try {
            HttpURLConnection conn = (HttpURLConnection) new URL(urlStr).openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("x-auth-code", ApiConfig.AUTH_CODE);
            conn.setRequestProperty("x-device-id", ApiConfig.DEVICE_ID);
            conn.setRequestProperty("x-user-id", ApiConfig.USER_ID);

            int responseCode = conn.getResponseCode();
            if (responseCode == 200) {
                System.out.println("✅ Reprocess Stage 2 complete for Book ID: " + bookId);
                System.out.println("Now FAQ's will be Visible");
            } else {
                System.err.println("❌ Reprocess Stage 2 failed. Book ID: " + bookId + ", HTTP " + responseCode);
            }
        } catch (IOException e) {
            System.err.println("Error during Reprocess Stage 2: " + e.getMessage());
        }
    }
}
