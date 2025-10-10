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

public class BinManager {

    private static final String BANNED_BINS_FILE = "banned_bins.txt";
    private static final Set<String> bannedBins = ConcurrentHashMap.newKeySet();
    private static final ReentrantReadWriteLock LOCK = new ReentrantReadWriteLock();

    public static void loadBannedBins() {
        LOCK.writeLock().lock();
        try {
            if (Files.exists(Path.of(BANNED_BINS_FILE))) {
                bannedBins.clear();
                bannedBins.addAll(Files.readAllLines(Path.of(BANNED_BINS_FILE), StandardCharsets.UTF_8));
            }
        } catch (IOException e) {
            System.out.println("Error loading banned bins: " + e.getMessage());
        } finally {
            LOCK.writeLock().unlock();
        }
    }

    private static void persistSnapshot(List<String> snapshot) {
        try {
            Files.write(Path.of(BANNED_BINS_FILE), snapshot, StandardCharsets.UTF_8);
        } catch (IOException e) {
            System.out.println("Error saving banned bins: " + e.getMessage());
        }
    }

    public static void addBannedBin(String bin) {
        List<String> snapshot = null;
        LOCK.writeLock().lock();
        try {
            if (bannedBins.add(bin)) {
                snapshot = new ArrayList<>(bannedBins);
            }
        } finally {
            LOCK.writeLock().unlock();
        }
        if (snapshot != null) {
            persistSnapshot(snapshot);
        }
    }

    public static boolean isBinBanned(String bin) {
        LOCK.readLock().lock();
        try {
            return bannedBins.contains(bin);
        } finally {
            LOCK.readLock().unlock();
        }
    }
}
