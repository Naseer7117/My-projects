//This Searches Book titles by entering the Query in the Db 

package com.upload.db;

import com.upload.config.DbConfig;
import com.upload.model.Book;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class BookRepository {

    public static List<Book> getBookIdsFromTitle(String title) {
        List<Book> books = new ArrayList<>();
        String query = "SELECT id, title FROM sia_books.books WHERE title ILIKE ?";

        try (Connection conn = DriverManager.getConnection(DbConfig.getJdbcUrl(), DbConfig.DB_USER, DbConfig.DB_PASSWORD);
             PreparedStatement stmt = conn.prepareStatement(query)) {

            stmt.setString(1, "%" + title + "%");
            ResultSet rs = stmt.executeQuery();

            while (rs.next()) {
                int id = rs.getInt("id");
                String bookTitle = rs.getString("title");
                books.add(new Book(id, bookTitle));
            }

        } catch (SQLException e) {
            System.err.println("Database error while fetching Book IDs: " + e.getMessage());
        }

        return books;
    }
}
