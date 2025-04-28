package com.upload.service;

import com.upload.util.*;
import com.upload.service.UploaderService.UploadResult;

import java.io.File;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class FolderScanner {

    public static boolean scanAndUpload(File folder, int bookId, Map<String, PartType> partTypeMap) {
        System.out.println("\n📚 Uploading files for Book ID: " + bookId + ", Folder: " + folder.getName());

        File[] subfolders = folder.listFiles(File::isDirectory);
        if (subfolders == null || subfolders.length == 0) {
            System.out.println("⚠️ No subfolders found in " + folder.getName());
            return false;
        }

        boolean foundValid = false;
        boolean hasFailures = false;
        boolean lmrUploaded = false;  // Track if LMR was uploaded
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
                        System.out.println("📄 Uploading-file: " + file.getName() + " | Unit number: " + unitNumber);

                        UploadResult result = UploaderService.uploadFile(file, bookId, unitNumber, part.bookPartType);
                        if (result.success) {
                            System.out.println("✅ Uploaded: " + file.getName() + "|Book id: " + bookId + "|Part: " +part.bookPartType);
                            if (!result.unitId.isEmpty()) {
                                System.out.println("📌 Unit ID: " + result.unitId);
                                UploadLogger.logUpload(bookId, part.bookPartType, unitNumber, result.unitId);
                            }
                            if (part.bookPartType.equalsIgnoreCase("QUESTIONANDANSWER")) {
                                lmrUploaded = true;
                            }
                        }else {
                            System.out.println("❌ Failed: " + file.getName());
                            hasFailures = true;
                        }
                    }

                    foundValid = true;
                    break;
                }
            }
        }
        if (!foundValid) {
            System.out.println("⚠️ No valid part type folders are present in this Book ID folder.");
        } else {
            System.out.println("\n✅ Total valid part types found: " + partCount);
        }
        if (lmrUploaded) {
            ReprocessorService.reprocessLMR(bookId);
        }
        return foundValid && !hasFailures;
    }
//-------------this takes the number to consider it for which unit , file name should consist of unit-1 like this
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
//------This takes part Type to map it in Api Accordingly from PartType registry    
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
