/*
  # Enable pgvector extension

  1. Extensions
    - Enable `vector` extension for similarity search functionality
    
  2. Notes
    - This must be run before creating tables with vector columns
    - Required for the legal_documents table embedding column
*/

-- Enable the vector extension for similarity search
CREATE EXTENSION IF NOT EXISTS vector;