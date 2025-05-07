#!/bin/bash

# Script to remove sensitive files before creating a distribution or sharing code
# This helps ensure that no credentials or sensitive information is accidentally leaked

echo "Cleaning sensitive files from the project..."

# List of sensitive files to remove or replace with example versions
SENSITIVE_FILES=(
  ".env"
  ".env.development"
  ".env.production"
  ".env.local"
)

# Check if files exist and remove them
for file in "${SENSITIVE_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Removing $file..."
    rm "$file"
  fi
done

# Make sure .env.example exists
if [ ! -f ".env.example" ]; then
  echo "Warning: .env.example file not found. Creating a basic one..."
  cat > .env.example << EOL
# Supabase connection
REACT_APP_SUPABASE_URL=https://your-supabase-project.supabase.co
REACT_APP_SUPABASE_SERVICE_KEY=your_supabase_service_key_here

# API endpoints
REACT_APP_BACKEND_URL=https://your-api-backend-url.com
REACT_APP_API_USERNAME=your_api_username
REACT_APP_API_PASSWORD=your_api_password

# Print settings
REACT_APP_PRINT_AGENT_ID=your_print_agent_id
EOL
  echo "Created .env.example with placeholders"
fi

echo "Creating clean versions of environment files with placeholders..."

# Create safe placeholder .env for distribution
cat > .env << EOL
# Supabase connection
REACT_APP_SUPABASE_URL=https://your-supabase-project.supabase.co
REACT_APP_SUPABASE_SERVICE_KEY=your_supabase_service_key_here

# API endpoints
REACT_APP_BACKEND_URL=https://your-api-backend-url.com
REACT_APP_API_USERNAME=your_api_username
REACT_APP_API_PASSWORD=your_api_password

# Print settings
REACT_APP_PRINT_AGENT_ID=your_print_agent_id
EOL

echo "Cleaning logs directory..."
find ./logs -type f -name "*.log" -delete 2>/dev/null

echo "Cleaning completed successfully."
echo "Remember to set up your environment variables before running the application."
