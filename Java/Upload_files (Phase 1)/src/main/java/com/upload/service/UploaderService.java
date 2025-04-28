package com.upload.service;

import com.upload.config.ApiConfig;
import com.upload.util.UploadLogger;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.file.Files;
import java.util.Scanner;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class UploaderService {

	public static UploadResult uploadFile(File file, int bookId, int unitNumber, String bookPartType) {
        String boundary = "----WebKitFormBoundary" + System.currentTimeMillis();
        String lineEnd = "\r\n";
        String twoHyphens = "--";

        try {
            URL url = new URL(ApiConfig.UPLOAD_URL);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setDoOutput(true);
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "multipart/form-data; boundary=" + boundary);
            conn.setRequestProperty("x-auth-code", ApiConfig.AUTH_CODE);
            conn.setRequestProperty("x-device-id", ApiConfig.DEVICE_ID);
            conn.setRequestProperty("x-user-id", ApiConfig.USER_ID);

            try (DataOutputStream request = new DataOutputStream(conn.getOutputStream())) {
                // Add bookId
                request.writeBytes(twoHyphens + boundary + lineEnd);
                request.writeBytes("Content-Disposition: form-data; name=\"bookId\"" + lineEnd);
                request.writeBytes(lineEnd);
                request.writeBytes(String.valueOf(bookId));
                request.writeBytes(lineEnd);

                // Add unitNumber
                request.writeBytes(twoHyphens + boundary + lineEnd);
                request.writeBytes("Content-Disposition: form-data; name=\"unitNumber\"" + lineEnd);
                request.writeBytes(lineEnd);
                request.writeBytes(String.valueOf(unitNumber));
                request.writeBytes(lineEnd);

                // Add bookPartType
                request.writeBytes(twoHyphens + boundary + lineEnd);
                request.writeBytes("Content-Disposition: form-data; name=\"bookPartType\"" + lineEnd);
                request.writeBytes(lineEnd);
                request.writeBytes(bookPartType);
                request.writeBytes(lineEnd);

                // Add file
                request.writeBytes(twoHyphens + boundary + lineEnd);
                request.writeBytes("Content-Disposition: form-data; name=\"book\"; filename=\"" + file.getName() + "\"" + lineEnd);
                request.writeBytes("Content-Type: application/octet-stream" + lineEnd);
                request.writeBytes(lineEnd);

                Files.copy(file.toPath(), request);
                request.writeBytes(lineEnd);
                request.writeBytes(twoHyphens + boundary + twoHyphens + lineEnd);
                request.flush();
            }

            int responseCode = conn.getResponseCode();
            try (Scanner scanner = new Scanner(conn.getInputStream()).useDelimiter("\\A")) {
                String response = scanner.hasNext() ? scanner.next() : "";
                String unitId = extractUnitIdFromText(response);
                if (!unitId.equals("Not Found")) {
                } else {
                    System.out.println("ℹ️ No Unit ID found in response.");
                    System.out.println("🧾 API Raw Response: " + response);
                }
                return new UploadResult(true, unitId);
            }
        } catch (IOException e) {
            System.err.println("Error uploading file " + file.getName() + ": " + e.getMessage());
            return new UploadResult(false, "");
        }
    }

    private static String extractUnitIdFromText(String response) {
        try {
            Pattern pattern = Pattern.compile("UnitID\\s*:\\s*\\[(\\d+)]");
            Matcher matcher = pattern.matcher(response);
            if (matcher.find()) {
                return matcher.group(1);
            }
        } catch (Exception ignored) {}
        return "Not Found";
    }
    public static class UploadResult {
        public final boolean success;
        public final String unitId;

        public UploadResult(boolean success, String unitId) {
            this.success = success;
            this.unitId = unitId;
        }
    }
}