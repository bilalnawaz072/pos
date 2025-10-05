# Use a lightweight Alpine base image
FROM alpine:latest

# Install SQLite
RUN apk update && apk add --no-cache sqlite

# Set up a directory for the SQLite database
WORKDIR /db

# Set the DATABASE_URL environment variable
# Replace '/db/mydatabase.db' with your desired database file path
ENV DATABASE_URL="file:/db/mydatabase.db"

# Create an empty SQLite database file
RUN sqlite3 /db/mydatabase.db "VACUUM;"

# Keep the container running (optional, for testing purposes)
CMD ["tail", "-f", "/dev/null"]