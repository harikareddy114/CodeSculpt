<<<<<<< HEAD
-- Create the database if not exists
=======
>>>>>>> 78232c4404a69fb803a241c1e10d08b7c2865eae
CREATE DATABASE IF NOT EXISTS codepen;

USE codepen;

<<<<<<< HEAD
-- Create the code_snippets table
=======
>>>>>>> 78232c4404a69fb803a241c1e10d08b7c2865eae
CREATE TABLE IF NOT EXISTS code_snippets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  html TEXT,
  css TEXT,
  js TEXT,
  project_title VARCHAR(255),
  project_id VARCHAR(36)
);
