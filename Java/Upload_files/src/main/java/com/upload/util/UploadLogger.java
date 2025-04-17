package com.upload.util;
import com.opencsv.CSVWriter;

import java.io.File;
import java.io.FileWriter;
import java.util.*;

public class UploadLogger {

    private static final Map<String, List<String>> uploadRecords = new LinkedHashMap<>();

    public static void logUpload(int bookId, String partType, int unitNumber, String unitId) {
        String key = bookId + "," + partType + "," + unitNumber;
        uploadRecords.computeIfAbsent(key, k -> new ArrayList<>()).add(unitId);
    }

    public static Map<String, List<String>> getUploadRecords() {
        return uploadRecords;
    }

    public static void clear() {
        uploadRecords.clear();
    }

    // ✅ ADD THIS METHOD TO SAVE CSV FROM HERE
    public static void saveToCSV(String filePath) {
        File csvFile = new File(filePath);
        boolean fileExists = csvFile.exists();

        try (FileWriter fw = new FileWriter(csvFile, true);
             CSVWriter writer = new CSVWriter(fw)) {

            if (!fileExists) {
                writer.writeNext(new String[]{"Book ID", "Part Type", "Unit Number", "Unit ID(s)"});
            }

            for (Map.Entry<String, List<String>> entry : uploadRecords.entrySet()) {
                String[] parts = entry.getKey().split(",");
                List<String> row = new ArrayList<>(Arrays.asList(parts));
                row.addAll(entry.getValue());
                writer.writeNext(row.toArray(new String[0]));
            }

            System.out.println("✅ Upload report saved to " + filePath);

        } catch (Exception e) {
            System.err.println("❌ Error saving CSV: " + e.getMessage());
        }
    }
}
