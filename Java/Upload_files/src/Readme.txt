Structure of the project folder :  

📦 com.upload.config
For configurations like API URLs, headers, DB and folder paths.

ApiConfig.java

DbConfig.java

UploadConstants.java

📦 com.upload.ssh
For SSH tunnel handling and check if running.

SshManager.java

📦 com.upload.db
For PostgreSQL database interactions.

BookRepository.java

📦 com.upload.model
For basic data objects.

Book.java

UploadRecord.java

📦 com.upload.service
For logic like file upload, reprocessing, and folder processing.

UploaderService.java

ReprocessorService.java

FolderScanner.java

📦 com.upload.util
For shared utility methods.

FileUtils.java

UniversityUtil.java

📦 com.upload
Main runner

UploadRunner.java (your main method)

