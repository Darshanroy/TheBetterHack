# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

# Database Setup

## Development Database (SQLite)

For rapid prototyping, we're using SQLite. Follow these steps to set up the database:

1. Install dependencies:
   ```bash
   npm install
   ```

2. Generate Prisma client:
   ```bash
   npm run db:generate
   ```

3. Create and initialize the database:
   ```bash
   npm run db:push
   ```

4. (Optional) View and manage data using Prisma Studio:
   ```bash
   npm run db:studio
   ```

The SQLite database file (`dev.db`) will be created in the `prisma` directory and is automatically ignored by git.
