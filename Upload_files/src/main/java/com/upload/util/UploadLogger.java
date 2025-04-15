//In this File The logs Uploaded data like title, part type and unit id were tracked in an Excel File

package com.upload.util;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;

public class UploadLogger {

    private static final String CSV_FILE = "upload_report.csv";

    public static void logUpload(int bookId, String partType, int unitNumber, String fileName) {
        File file = new File(CSV_FILE);
        boolean exists = file.exists();

        try (BufferedWriter writer = new BufferedWriter(new FileWriter(file, true))) {
            if (!exists) {
                writer.write("Book ID,Part Type,Unit Number,File Name\n");
            }
            writer.write(String.format("%d,%s,%d,%s\n", bookId, partType, unitNumber, fileName));
        } catch (IOException e) {
            System.err.println("❌ Failed to write upload record: " + e.getMessage());
        }
    }
}
