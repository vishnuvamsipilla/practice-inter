CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS templates (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(191) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  category_id INT NOT NULL,
  thumbnail_path VARCHAR(500) NOT NULL,
  status ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  views BIGINT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- Gallery, all categories: WHERE status = 'published' ORDER BY created_at DESC, id DESC
  INDEX idx_status_created (status, created_at, id),
  -- Gallery, one category: WHERE status = 'published' AND category_id = ? ORDER BY created_at DESC, id DESC
  INDEX idx_status_cat_created (status, category_id, created_at, id)
);
