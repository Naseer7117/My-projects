import requests
import re
import os
import csv
import psycopg2
import subprocess
import time
from collections import defaultdict

# ---------------------------
# API Configuration
# ---------------------------

UPLOAD_URL = 'https://api.sianext.com/parse/processBookPart'
REPROCESS_STAGE1_URL = 'https://api.sianext.com/parse/reProcessLMRPdfFiles/{book_id}'
REPROCESS_STAGE2_URL = 'https://api.sianext.com/parse/processFileFromDB/{book_id}?bookparttype={book_part_type}'

HEADERS = {
    'x-auth-code': '82533bf8-7c3d-4bc5-bc40-683b7d01fc88',
    'x-device-id': 'rnd',
    'x-user-id': 'rnd'
}

# ---------------------------
# Upload Folder Configuration
# ---------------------------

BASE_FOLDER_PATH = r'D:\uploads'

# ---------------------------
# Database Configuration
# ---------------------------

DB_CONFIG = {
    'host': 'localhost',
    'user': 'sia_prod',
    'password': 'yrMQNk5uLe1yw2k',
    'database': 'sia_db'
}

# ---------------------------
# SSH Tunnel Configuration
# ---------------------------

SSH_KEY_PATH = r'D:/Office-Learn/SQL Queries for Office/sia_ssh_key.pem'
SSH_USER = 'ubuntu'
SSH_HOST = '3.109.135.116'

# ---------------------------
# Mapping Subfolder Keywords to BookPartTypes
# ---------------------------

PART_TYPE_MAPPING = {
    'LMR': (8, 1, 'QUESTIONANDANSWER', 'LMR uploaded Successfully.'),
    'MID': (14, 1, 'LECTURENOTESINTERNALASSESSMENT', 'Mids uploaded Successfully.'),
    'PYQ': (6, 0, 'EXAM_QP', 'PYQ uploaded Successfully.'),
    'NOTES': (12, 1, 'LECTURENOTES', 'Lecture notes were uploaded.'),
    'IA': (14, 1, 'LECTURENOTESINTERNALASSESSMENT', 'Internal Assessment files were Uploaded.'),
    'SUMMARY': (13, 1, 'LECTURENOTESSUMMARY', 'Summary Files were Uploaded.'),
    'MODEL PAPER': (6, 0, 'EXAM_QP', 'Model Papers uploaded successfully.')
}

# ---------------------------
# Tracking Uploads
# ---------------------------

upload_records = defaultdict(list)
skipped_folders = []

# ---------------------------
# Helper Functions
# ---------------------------

def start_ssh_tunnel():
    print("Starting SSH tunnel...")
    tunnel_command = [
        'ssh',
        '-o', 'StrictHostKeyChecking=no',
        '-i', SSH_KEY_PATH,
        '-L', '5432:localhost:5432',
        f'{SSH_USER}@{SSH_HOST}'
    ]
    tunnel = subprocess.Popen(tunnel_command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    time.sleep(5)
    print("SSH tunnel established.")
    return tunnel

def get_book_ids_from_title(title):
    try:
        cleaned_title = re.sub(r'\s*\([^)]*\)', '', title).strip()
        print(f"Searching for book title: '{cleaned_title}'")

        connection = psycopg2.connect(**DB_CONFIG)
        cursor = connection.cursor()
        query = "SELECT id, title FROM sia_books.books WHERE title ILIKE %s"
        cursor.execute(query, (cleaned_title,))
        results = cursor.fetchall()
        cursor.close()
        connection.close()
        if results:
            return results
        else:
            return []
    except Exception as e:
        print(f"Database error while fetching Book IDs for title '{title}': {str(e)}")
        return []

def upload_files(book_id, subfolder_path, book_part_type_name, book_part_type_id, start_unit_number):
    files = [os.path.join(subfolder_path, f) for f in os.listdir(subfolder_path) if os.path.isfile(os.path.join(subfolder_path, f))]
    files.sort()

    if not files:
        print(f"No files found in {subfolder_path}. Skipping...")
        return False

    for file_path in files:
        filename = os.path.basename(file_path)

        if start_unit_number == 1:
            match = re.search(r'\d+', filename)
            unit_number = int(match.group(0)) if match else 0
        else:
            unit_number = 0

        try:
            with open(file_path, 'rb') as f:
                upload_data = {'book': f}
                data = {
                    'bookId': book_id,
                    'unitNumber': str(unit_number),
                    'bookPartType': book_part_type_name
                }
                response = requests.post(UPLOAD_URL, headers=HEADERS, files=upload_data, data=data)

                if response.status_code == 200:
                    response_text = response.text
                    print(f"Uploaded {filename} successfully (BookID {book_id}, Unit {unit_number}, PartType {book_part_type_name})")
                    match = re.search(r'UnitID\s*:\s*\[(\d+)\]', response_text)
                    if match:
                        unit_id = match.group(1)
                        print(f"Unit ID: {unit_id}")
                    else:
                        unit_id = 'Not Found'
                        print("No Unit ID found in response.")

                    upload_records[(book_id, book_part_type_name, unit_number)].append(unit_id)
                else:
                    print(f"Failed to upload {filename} in part type {book_part_type_name}. Status Code: {response.status_code}")
                    print('Response:', response.text)
        except Exception as e:
            print(f"Error uploading {filename} in part type {book_part_type_name}: {str(e)}")

    return True

def reprocess_stages(book_id):
    try:
        print("\nStarting Reprocess Stage 1...")
        url1 = REPROCESS_STAGE1_URL.format(book_id=book_id)
        resp1 = requests.get(url1, headers=HEADERS)

        if resp1.status_code == 200:
            print(f"Reprocess Stage 1 completed successfully for Book ID {book_id}.")
            print("Starting Reprocess Stage 2...")

            url2 = REPROCESS_STAGE2_URL.format(book_id=book_id, book_part_type='QUESTIONANDANSWER')
            resp2 = requests.get(url2, headers=HEADERS)

            if resp2.status_code == 200:
                print(f"Reprocess Stage 2 completed successfully for Book ID {book_id}.")
                print("\nReprocess done successfully. Now FAQ will be visible.")
            else:
                print(f"Failed Reprocess Stage 2. Status Code: {resp2.status_code}")
        else:
            print(f"Failed Reprocess Stage 1. Status Code: {resp1.status_code}")

    except Exception as e:
        print(f"Error during Reprocess Stages: {str(e)}")

# ---------------------------
# Main Processing Starts Here
# ---------------------------

ssh_tunnel = start_ssh_tunnel()

if not os.path.isdir(BASE_FOLDER_PATH):
    print(f"Invalid uploads folder: {BASE_FOLDER_PATH}. Exiting...")
    ssh_tunnel.terminate()
    exit()

book_folders = [f for f in os.listdir(BASE_FOLDER_PATH) if os.path.isdir(os.path.join(BASE_FOLDER_PATH, f))]

if not book_folders:
    print("No Book ID or Title folders found in uploads.")
    ssh_tunnel.terminate()
    exit()

print(f"Found {len(book_folders)} folders to process.")

for book_folder in book_folders:
    book_folder_path = os.path.join(BASE_FOLDER_PATH, book_folder)

    try:
        book_id = int(book_folder)
        book_entries = [(book_id, book_folder)]
    except ValueError:
        book_entries = get_book_ids_from_title(book_folder)
        if not book_entries:
            print(f"Book title '{book_folder}' not found in database. Skipping...")
            skipped_folders.append(book_folder)
            continue

    for book_id, book_title in book_entries:
        if not (1 <= int(book_id) <= 9999):
            print(f"Book ID {book_id} (from folder {book_folder}) is invalid. Skipping...")
            skipped_folders.append(book_folder)
            continue

        print(f"\n📚 Uploading files for Book ID: {book_id}, Title: {book_title}")

        subfolders = [f for f in os.listdir(book_folder_path) if os.path.isdir(os.path.join(book_folder_path, f))]
        found_valid_folder = False

        for subfolder in subfolders:
            subfolder_path = os.path.join(book_folder_path, subfolder)
            upper_name = subfolder.upper()

            for keyword, (part_type_id, start_unit, part_type_name, success_message) in PART_TYPE_MAPPING.items():
                if keyword in upper_name:
                    print(f"Folder '{keyword}' found in Book ID {book_id}.")
                    print(f"Starting Upload in this Folder '{keyword}'...")
                    uploaded = upload_files(book_id, subfolder_path, part_type_name, part_type_id, start_unit)
                    if uploaded:
                        print(success_message)
                        found_valid_folder = True
                        if keyword == 'LMR':
                            reprocess_stages(book_id)
                    break

        if not found_valid_folder:
            print("No specific book part type folders are present in this Book ID folder.")

        print(f"✅ Finished uploading for Book ID: {book_id}, Title: {book_title}\n")

print("All the Book IDs inside Uploads were Uploaded Successfully.")

# Save Uploads to CSV
if upload_records:
    csv_file = 'upload_report.csv'
    file_exists = os.path.isfile(csv_file)

    with open(csv_file, mode='a', newline='') as file:
        writer = csv.writer(file)
        if not file_exists:
            writer.writerow(['Book ID', 'Book Part Type', 'Unit Number', 'Unit ID 1', 'Unit ID 2', 'Unit ID 3', '...'])

        for (book_id, book_part_type, unit_number), unit_ids in upload_records.items():
            row = [book_id, book_part_type, unit_number] + unit_ids
            writer.writerow(row)

    print(f"Upload report saved to {csv_file}.")
else:
    print("No uploads were recorded to save into CSV.")

# Skipped Folders Report
print("\n------------------------------------------")
if skipped_folders:
    print("Some folders were skipped:")
    for folder in skipped_folders:
        print(f"- {folder}")
else:
    print("✅ No folders skipped. Everything uploaded successfully!")
print("------------------------------------------\n")

ssh_tunnel.terminate()
print("SSH tunnel closed.")
