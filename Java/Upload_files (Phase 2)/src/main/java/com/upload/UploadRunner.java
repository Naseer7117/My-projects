package com.upload;

import com.upload.config.PartTypeRegistry;
import com.upload.db.BookRepository;
import com.upload.model.Book;
import com.upload.service.FolderScanner;
import com.upload.service.FolderScanner.PartType;
import com.upload.ssh.SshManager;
import com.upload.util.*;

import java.io.File;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class UploadRunner {

    private static final File BASE_FOLDER = new File("D:/uploads");
    private static final Set<String> ALLOWED_UNIVERSITIES = Set.of("ou", "ku", "mgu", "jntu");

    public static void main(String[] args) {
        SshManager.startTunnel(
            "D:/Office-Learn/SQL Queries for Office/sia_ssh_key.pem",
            "ubuntu",
            "3.109.135.116",
            5432,
            5432
        );

        if (!BASE_FOLDER.exists()) {
            BASE_FOLDER.mkdirs();
            System.out.println("📂 Created base folder: " + BASE_FOLDER.getAbsolutePath());
        }

        try {
            // Fetch matching folders from FTP first
            List<String> dummySearchList = List.of(""); // Pass dummy list to trigger full FTP scan
            List<File> downloadedBookFolders = FtpManager.fetchMatchingBookFolders(dummySearchList, BASE_FOLDER.getAbsolutePath());

            if (downloadedBookFolders.isEmpty()) {
                System.out.println("❌ No matching folders downloaded from FTP.");
                SshManager.stopTunnel();
                return;
            }

            File[] bookFolders = BASE_FOLDER.listFiles(File::isDirectory);

            if (bookFolders == null || bookFolders.length == 0) {
                System.out.println("No book folders found in: " + BASE_FOLDER.getAbsolutePath());
                SshManager.stopTunnel();
                return;
            }

            System.out.println("📦 Found " + bookFolders.length + " folders to process.");

            Set<String> uploadedFolders = new HashSet<>();
            Set<String> processedBaseTitles = new HashSet<>();
            List<String> failedFolders = new ArrayList<>();

            for (File bookFolder : bookFolders) {
                String folderName = bookFolder.getName();
                String folderKey = folderName.toLowerCase();
                String baseTitle = folderName.replaceAll("\\s*\\([^)]*\\)", "").trim().toLowerCase();

                if (processedBaseTitles.contains(baseTitle)) {
                    continue;
                }

                List<Book> matchingBooks = new ArrayList<>();

                try {
                    int bookId = Integer.parseInt(baseTitle);
                    matchingBooks.add(new Book(bookId, folderName));
                    System.out.println("🔎 Detected numeric folder name — using Book ID: " + bookId);
                } catch (NumberFormatException e) {
                    System.out.println("🔎 Searching for book title: '" + baseTitle + "' (ignoring brackets)");
                    matchingBooks = BookRepository.getBookIdsFromTitle(baseTitle);
                }

                if (matchingBooks.isEmpty()) {
                    System.out.println("❌ No matching books found for: " + folderName);
                    failedFolders.add(folderName);
                    continue;
                }

                boolean commonToAll = folderName.toLowerCase().contains("(common)");
                if (commonToAll) {
                    System.out.println("🧠 Detected (Common) in folder name — assuming common content for all universities.");
                } else if (matchingBooks.size() > 1) {
                    System.out.println("🧠 Multiple book matches found. Assuming content is NOT common to all universities.");
                    commonToAll = false;
                } else {
                    commonToAll = true;
                }

                boolean success = true;

                if (commonToAll) {
                    for (Book book : matchingBooks) {
                        boolean result = FolderScanner.scanAndUpload(bookFolder, book.getId(), PartTypeRegistry.PART_TYPES);
                        success = success && result;
                    }
                    uploadedFolders.add(folderKey);
                } else {
                    boolean matched = false;
                    for (File folder : bookFolders) {
                        String universityFolderName = folder.getName();
                        String base = universityFolderName.replaceAll("\\s*\\([^)]*\\)", "").trim().toLowerCase();
                        String universityFolderKey = universityFolderName.toLowerCase();

                        if (!base.equals(baseTitle)) continue;
                        if (uploadedFolders.contains(universityFolderKey)) continue;

                        String folderUniv = extractUniversityCode(universityFolderName);
                        for (Book book : matchingBooks) {
                            String bookUniv = extractUniversityCode(book.getTitle());
                            if (folderUniv != null && bookUniv != null && folderUniv.equalsIgnoreCase(bookUniv)) {
                                boolean result = FolderScanner.scanAndUpload(folder, book.getId(), PartTypeRegistry.PART_TYPES);
                                success = success && result;
                                matched = true;
                                uploadedFolders.add(universityFolderKey);
                            }
                        }
                    }
                    if (!matched) {
                        failedFolders.add(folderName);
                        continue;
                    }
                }

                if (success) {
                    System.out.println("🗑️ Deleting uploaded folder: " + bookFolder.getAbsolutePath());
                    deleteFolder(bookFolder);
                } else {
                    failedFolders.add(folderName);
                }

                processedBaseTitles.add(baseTitle);
            }

            System.out.println("\n------------------------------------------");
            if (failedFolders.isEmpty()) {
                System.out.println("✅ All folders were uploaded successfully.");
            } else {
                System.out.println("❌ Some folders had upload issues:");
                for (String folder : failedFolders) {
                    System.out.println("- " + folder);
                }
            }
            System.out.println("------------------------------------------\n");
            UploadLogger.saveToCSV("upload_report.csv");

        } catch (Exception e) {
            System.err.println("❌ Error during upload process: " + e.getMessage());
            e.printStackTrace();
        } finally {
            SshManager.stopTunnel();
        }
    }
//----------------------Helper method for deleting folders
    private static void deleteFolder(File folder) {
        if (folder.isDirectory()) {
            for (File file : folder.listFiles()) {
                deleteFolder(file);
            }
        }
        folder.delete();
    }
//-------if common not there but multiple books found this divides the books with univ code in Title
    private static String extractUniversityCode(String name) {
        Matcher m = Pattern.compile("\\((.*?)\\)").matcher(name);
        if (m.find()) {
            String content = m.group(1).toLowerCase();
            return ALLOWED_UNIVERSITIES.contains(content) ? content : null;
        }
        return null;
    }
}
