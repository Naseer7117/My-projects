package com.tammudu.managers;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.charset.StandardCharsets;
import java.io.IOException;
import java.util.HashSet;
import java.util.Set;

public class BinManager {

    private static final String BANNED_BINS_FILE = "banned_bins.txt";
    private static Set<String> bannedBins = new HashSet<>();

    public static void loadBannedBins() {
        try {
            if (Files.exists(Path.of(BANNED_BINS_FILE))) {
                bannedBins.addAll(Files.readAllLines(Path.of(BANNED_BINS_FILE), StandardCharsets.UTF_8));
            }
        } catch (IOException e) {
            System.out.println("Error loading banned bins: " + e.getMessage());
        }
    }

    public static void saveBannedBins() {
        try {
            Files.write(Path.of(BANNED_BINS_FILE), bannedBins, StandardCharsets.UTF_8);
        } catch (IOException e) {
            System.out.println("Error saving banned bins: " + e.getMessage());
        }
    }

    public static void addBannedBin(String bin) {
        bannedBins.add(bin);
        saveBannedBins();
    }

    public static boolean isBinBanned(String bin) {
        return bannedBins.contains(bin);
    }
}
