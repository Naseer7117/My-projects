package com.upload.config;

public class ApiConfig {
    public static final String UPLOAD_URL = "https://api.sianext.com/parse/processBookPart";
    public static final String REPROCESS_STAGE1_URL = "https://api.sianext.com/parse/reProcessLMRPdfFiles/%d";
    public static final String REPROCESS_STAGE2_URL = "https://api.sianext.com/parse/processFileFromDB/%d?bookparttype=%s";

    public static final String AUTH_CODE = "82533bf8-7c3d-4bc5-bc40-683b7d01fc88";
    public static final String DEVICE_ID = "rnd";
    public static final String USER_ID = "rnd";
}