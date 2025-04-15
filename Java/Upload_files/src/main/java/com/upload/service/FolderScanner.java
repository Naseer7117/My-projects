package com.upload.service;

import com.upload.service.UploaderService;
import com.upload.service.ReprocessorService;

import java.io.File;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class FolderScanner {

    public static void scanAndUpload(File folder, int bookId, Map<String, PartType> partTypeMap) {
        System.out.println("\n📚 Uploading files for Book ID: " + bookId + ", Folder: " + folder.getName());

        File[] subfolders = folder.listFiles(File::isDirectory);
        if (subfolders == null || subfolders.length == 0) {
            System.out.println("⚠️ No subfolders found in " + folder.getName());
            return;
        }

        boolean foundValid = false;
        int partCount = 0;

        for (File subfolder : subfolders) {
            String folderName = subfolder.getName().toUpperCase();
            for (Map.Entry<String, PartType> entry : partTypeMap.entrySet()) {
                if (folderName.contains(entry.getKey().toUpperCase())) {
                    PartType part = entry.getValue();
                    File[] files = subfolder.listFiles(File::isFile);
                    if (files == null || files.length == 0) continue;

                    System.out.println("\n📁 Folder '" + entry.getKey() + "' found in Book ID " + bookId);
                    System.out.println("🚀 Starting upload for part type: " + part.bookPartType);

                    partCount++;

                    for (File file : files) {
                        int unitNumber = part.startUnit == 1 ? extractUnitNumber(file.getName()) : 0;
                        System.out.println("📄 Scanning file: " + file.getName() + " | Unit number: " + unitNumber);

                        boolean success = UploaderService.uploadFile(file, bookId, unitNumber, part.bookPartType);
                        if (success) {
                            System.out.println("✅ Uploaded: " + file.getName());
                        } else {
                            System.out.println("❌ Failed: " + file.getName());
                        }
                    }

                    foundValid = true;

                    if (part.bookPartType.equals("QUESTIONANDANSWER")) {
                        ReprocessorService.reprocessLMR(bookId);
                    }
                    break;
                }
            }
        }

        if (!foundValid) {
            System.out.println("⚠️ No valid part type folders are present in this Book ID folder.");
        } else {
            System.out.println("\n✅ Total valid part types found: " + partCount);
        }
    }

    private static int extractUnitNumber(String filename) {
        Pattern pattern = Pattern.compile("Unit[-_\s]?(\\d+)", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(filename);
        if (matcher.find()) {
            try {
                return Integer.parseInt(matcher.group(1));
            } catch (NumberFormatException e) {
                return 0;
            }
        }
        return 0;
    }

    public static class PartType {
        public int typeId;
        public int startUnit;
        public String bookPartType;

        public PartType(int typeId, int startUnit, String bookPartType) {
            this.typeId = typeId;
            this.startUnit = startUnit;
            this.bookPartType = bookPartType;
        }
    }
}