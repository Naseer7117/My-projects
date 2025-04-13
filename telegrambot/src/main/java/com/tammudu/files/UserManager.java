package com.tammudu.files;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.charset.StandardCharsets;
import java.io.IOException;
import java.util.HashSet;
import java.util.Set;

public class UserManager {

    private static final String USERS_FILE = "users.txt";
    private static Set<Long> users = new HashSet<>();

    public static void loadUsers() {
        try {
            if (Files.exists(Path.of(USERS_FILE))) {
                for (String line : Files.readAllLines(Path.of(USERS_FILE), StandardCharsets.UTF_8)) {
                    users.add(Long.parseLong(line.trim()));
                }
            }
        } catch (IOException e) {
            System.out.println("Error loading users: " + e.getMessage());
        }
    }

    public static void saveUsers() {
        try {
            Set<String> lines = new HashSet<>();
            for (Long id : users) {
                lines.add(String.valueOf(id));
            }
            Files.write(Path.of(USERS_FILE), lines, StandardCharsets.UTF_8);
        } catch (IOException e) {
            System.out.println("Error saving users: " + e.getMessage());
        }
    }

    public static void addUser(Long userId) {
        users.add(userId);
        saveUsers();
    }

    public static void removeUser(Long userId) {
        users.remove(userId);
        saveUsers();
    }

    public static boolean isUserAllowed(Long userId) {
        return users.contains(userId);
    }
}
