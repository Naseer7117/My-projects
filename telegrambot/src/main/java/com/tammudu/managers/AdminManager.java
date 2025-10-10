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

public class AdminManager {

    private static final String ADMINS_FILE = "admins.txt";
    private static final Set<Long> admins = ConcurrentHashMap.newKeySet();
    private static final ReentrantReadWriteLock LOCK = new ReentrantReadWriteLock();

    public static void loadAdmins() {
        LOCK.writeLock().lock();
        try {
            if (Files.exists(Path.of(ADMINS_FILE))) {
                admins.clear();
                for (String line : Files.readAllLines(Path.of(ADMINS_FILE), StandardCharsets.UTF_8)) {
                    admins.add(Long.parseLong(line.trim()));
                }
            }
        } catch (IOException e) {
            System.out.println("Error loading admins: " + e.getMessage());
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
            Files.write(Path.of(ADMINS_FILE), lines, StandardCharsets.UTF_8);
        } catch (IOException e) {
            System.out.println("Error saving admins: " + e.getMessage());
        }
    }

    public static void addAdmin(Long adminId) {
        List<Long> snapshot = null;
        LOCK.writeLock().lock();
        try {
            if (admins.add(adminId)) {
                snapshot = new ArrayList<>(admins);
            }
        } finally {
            LOCK.writeLock().unlock();
        }
        if (snapshot != null) {
            persistSnapshot(snapshot);
        }
    }

    public static void removeAdmin(Long adminId) {
        List<Long> snapshot = null;
        LOCK.writeLock().lock();
        try {
            if (admins.remove(adminId)) {
                snapshot = new ArrayList<>(admins);
            }
        } finally {
            LOCK.writeLock().unlock();
        }
        if (snapshot != null) {
            persistSnapshot(snapshot);
        }
    }

    public static boolean isAdmin(Long userId) {
        LOCK.readLock().lock();
        try {
            return admins.contains(userId);
        } finally {
            LOCK.readLock().unlock();
        }
    }
}
