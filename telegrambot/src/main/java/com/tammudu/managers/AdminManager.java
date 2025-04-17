package com.tammudu.managers;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.charset.StandardCharsets;
import java.io.IOException;
import java.util.HashSet;
import java.util.Set;

public class AdminManager {

    private static final String ADMINS_FILE = "admins.txt";
    private static Set<Long> admins = new HashSet<>();

    public static void loadAdmins() {
        try {
            if (Files.exists(Path.of(ADMINS_FILE))) {
                for (String line : Files.readAllLines(Path.of(ADMINS_FILE), StandardCharsets.UTF_8)) {
                    admins.add(Long.parseLong(line.trim()));
                }
            }
        } catch (IOException e) {
            System.out.println("Error loading admins: " + e.getMessage());
        }
    }

    public static void saveAdmins() {
        try {
            Set<String> lines = new HashSet<>();
            for (Long id : admins) {
                lines.add(String.valueOf(id));
            }
            Files.write(Path.of(ADMINS_FILE), lines, StandardCharsets.UTF_8);
        } catch (IOException e) {
            System.out.println("Error saving admins: " + e.getMessage());
        }
    }

    public static void addAdmin(Long adminId) {
        admins.add(adminId);
        saveAdmins();
    }

    public static void removeAdmin(Long adminId) {
        admins.remove(adminId);
        saveAdmins();
    }

    public static boolean isAdmin(Long userId) {
        return admins.contains(userId);
    }
}
