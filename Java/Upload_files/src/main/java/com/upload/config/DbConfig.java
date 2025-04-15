package com.upload.config;

public class DbConfig {
    public static final String DB_HOST = "localhost";
    public static final String DB_PORT = "5432";
    public static final String DB_NAME = "sia_db";
    public static final String DB_USER = "sia_prod";
    public static final String DB_PASSWORD = "yrMQNk5uLe1yw2k";

    public static String getJdbcUrl() {
        return String.format("jdbc:postgresql://%s:%s/%s", DB_HOST, DB_PORT, DB_NAME);
    }
}