package com.upload.util;

import com.upload.model.Book;
import com.upload.db.*;
import org.apache.commons.net.ftp.FTP;
import org.apache.commons.net.ftp.FTPClient;
import org.apache.commons.net.ftp.FTPFile;

import java.io.*;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;

public class FtpManager {

    private static final String HOST = "89.116.138.239";
    private static final int PORT = 21;
    private static final String USERNAME = "u313217784.sialecturenotes";
    private static final String PASSWORD = "SIA1@Publishers";
    private static final long HOURS_24_IN_SECONDS = 24 * 3600;

    public static List<File> fetchMatchingBookFolders(List<String> dummyList, String localTempDirPath) {
        List<File> downloadedFolders = new ArrayList<>();
        FTPClient ftpClient = new FTPClient();
        try {
            ftpClient.connect(HOST, PORT);
            boolean loggedIn = ftpClient.login(USERNAME, PASSWORD);
            ftpClient.enterLocalPassiveMode();
            ftpClient.setFileType(FTP.BINARY_FILE_TYPE);

            if (!loggedIn) {
                System.out.println("❌ FTP Login failed");
                return downloadedFolders;
            }

            System.out.println("✅ FTP Login Successful");
            System.out.println("🔎 Scanning Folders and Files...");
            long scanStartTime = System.currentTimeMillis();

            scanAndDownloadRecentFoldersAndFiles(ftpClient, "/", localTempDirPath, downloadedFolders);

            long scanEndTime = System.currentTimeMillis();
            long durationSeconds = (scanEndTime - scanStartTime) / 1000;
            System.out.println("✅ Scanning completed in " + durationSeconds + " seconds.");
            System.out.println("FTP Session is Closed !!");
        } catch (IOException e) {
            System.err.println("❌ FTP Error: " + e.getMessage());
        } finally {
            try {
                ftpClient.logout();
                ftpClient.disconnect();
            } catch (IOException e) {
                // Ignore
            }
        }
        return downloadedFolders;
    }

    private static void scanAndDownloadRecentFoldersAndFiles(FTPClient ftpClient, String remotePath, String localTempDirPath, List<File> downloadedFolders) throws IOException {
        FTPFile[] files = ftpClient.listFiles(remotePath);

        for (FTPFile file : files) {
            if (file.getName().equals(".") || file.getName().equals("..")) {
                continue;
            }

            String remoteFilePath = remotePath.equals("/") ? "/" + file.getName() : remotePath + "/" + file.getName();

            if (file.isDirectory()) {
                FTPFile folderEntry = ftpClient.mlistFile(remoteFilePath);
                if (folderEntry != null) {
                    ZonedDateTime folderModifiedTime = Instant.ofEpochMilli(folderEntry.getTimestamp().getTimeInMillis())
                            .atZone(ZoneId.systemDefault());
                    ZonedDateTime now = ZonedDateTime.now();
                    long secondsDifference = Math.abs(now.toEpochSecond() - folderModifiedTime.toEpochSecond());

                    if (secondsDifference <= HOURS_24_IN_SECONDS) {
                        String folderName = file.getName();
                        List<Book> matchingBooks = BookRepository.getBookIdsFromTitle(folderName.toLowerCase());

                        if (!matchingBooks.isEmpty()) {
                            System.out.println("📚 Recent Book Folder matched and found in DB: " + folderName);

                            File localFolder = new File(localTempDirPath, folderName);
                            if (!localFolder.exists()) {
                                localFolder.mkdirs();
                            }

                            downloadEntireFolder(ftpClient, remoteFilePath, localFolder);

                            if (!downloadedFolders.contains(localFolder)) {
                                downloadedFolders.add(localFolder);
                            }
                            continue;
                        }
                    }
                }

                scanAndDownloadRecentFoldersAndFiles(ftpClient, remoteFilePath, localTempDirPath, downloadedFolders);

            } else if (file.isFile()) {
                ZonedDateTime fileModifiedTime = Instant.ofEpochMilli(file.getTimestamp().getTimeInMillis())
                        .atZone(ZoneId.systemDefault());
                ZonedDateTime now = ZonedDateTime.now();
                long secondsDifference = Math.abs(now.toEpochSecond() - fileModifiedTime.toEpochSecond());

                if (secondsDifference <= HOURS_24_IN_SECONDS) {
                    System.out.println("✅ Recent File detected: " + remoteFilePath);

                    File localFolder = createLocalBookFolder(localTempDirPath, remoteFilePath, true);
                    File localFile = new File(localFolder, file.getName());

                    downloadSingleFile(ftpClient, remoteFilePath, localFile);

                    if (!downloadedFolders.contains(localFolder.getParentFile())) {
                        downloadedFolders.add(localFolder.getParentFile());
                    }
                }
            }
        }
    }

    private static void downloadEntireFolder(FTPClient ftpClient, String remoteFolderPath, File localFolder) throws IOException {
        FTPFile[] files = ftpClient.listFiles(remoteFolderPath);

        for (FTPFile file : files) {
            if (file.getName().equals(".") || file.getName().equals("..")) {
                continue;
            }

            String remoteFilePath = remoteFolderPath + "/" + file.getName();
            File localFile = new File(localFolder, file.getName());

            if (file.isFile()) {
                downloadSingleFile(ftpClient, remoteFilePath, localFile);
            } else if (file.isDirectory()) {
                localFile.mkdirs();
                downloadEntireFolder(ftpClient, remoteFilePath, localFile);
            }
        }
    }

    private static void downloadSingleFile(FTPClient ftpClient, String remoteFilePath, File localFile) throws IOException {
        try (OutputStream outputStream = new BufferedOutputStream(new FileOutputStream(localFile))) {
            ftpClient.retrieveFile(remoteFilePath, outputStream);
        }
        try {
            Thread.sleep(100);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private static File createLocalBookFolder(String baseLocalPath, String remotePath, boolean isFile) {
        String[] parts = remotePath.split("/");

        if (parts.length < 3) {
            return new File(baseLocalPath, "UnknownBook");
        }

        File localFolder;

        if (isFile) {
            String partType = parts[parts.length - 2];
            String bookTitle = parts[parts.length - 3];
            localFolder = new File(baseLocalPath, bookTitle + "/" + partType);
        } else {
            String bookTitle = parts[parts.length - 1];
            localFolder = new File(baseLocalPath, bookTitle);
        }

        if (!localFolder.exists()) {
            localFolder.mkdirs();
        }
        return localFolder;
    }
}