package com.tammudu.managers;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.charset.StandardCharsets;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantReadWriteLock;

public class UserManager {

    private static final String USERS_FILE = "users.txt";
    private static final Set<Long> users = ConcurrentHashMap.newKeySet();
    private static final ReentrantReadWriteLock LOCK = new ReentrantReadWriteLock();

    public static void loadUsers() {
        LOCK.writeLock().lock();
        try {
            if (Files.exists(Path.of(USERS_FILE))) {
                users.clear();
                for (String line : Files.readAllLines(Path.of(USERS_FILE), StandardCharsets.UTF_8)) {
                    users.add(Long.parseLong(line.trim()));
                }
            }
        } catch (IOException e) {
            System.out.println("Error loading users: " + e.getMessage());
        } finally {
            LOCK.writeLock().unlock();
        }
    }

    private static void persistSnapshot(List<Long> snapshot) {
        List<String> lines = new ArrayList<>(snapshot.size());
        for (Long id : snapshot) {
            lines.add(String.valueOf(id));
        }
        try {
            Files.write(Path.of(USERS_FILE), lines, StandardCharsets.UTF_8);
        } catch (IOException e) {
            System.out.println("Error saving users: " + e.getMessage());
        }
    }

    public static void addUser(Long userId) {
        List<Long> snapshot = null;
        LOCK.writeLock().lock();
        try {
            if (users.add(userId)) {
                snapshot = new ArrayList<>(users);
            }
        } finally {
            LOCK.writeLock().unlock();
        }
        if (snapshot != null) {
            persistSnapshot(snapshot);
        }
    }

    public static void removeUser(Long userId) {
        List<Long> snapshot = null;
        LOCK.writeLock().lock();
        try {
            if (users.remove(userId)) {
                snapshot = new ArrayList<>(users);
            }
        } finally {
            LOCK.writeLock().unlock();
        }
        if (snapshot != null) {
            persistSnapshot(snapshot);
        }
    }

    public static boolean isUserAllowed(Long userId) {
        LOCK.readLock().lock();
        try {
            return users.contains(userId);
        } finally {
            LOCK.readLock().unlock();
        }
    }
}
