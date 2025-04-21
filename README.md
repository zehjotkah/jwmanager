# JW Manager - Congregation Management System

This project is a management system designed to assist with scheduling and organizing activities for a Jehovah's Witnesses congregation, built using [Payload CMS](https://payloadcms.com/). It utilizes the Payload admin panel to manage members, meeting schedules, assignments, field service groups, and more.

This system was initially based on the official [Payload Website Template](https://github.com/payloadcms/payload/blob/main/templates/website) but has been significantly customized for its specific purpose.

## Core Features

*   **Weekly Meeting Scheduling:** Manage Midweek (Life & Ministry) and Weekend meeting schedules, including parts, assignments, songs, and calculated dates/times.
*   **Member Management (Publishers):** Maintain a database of congregation members (Publishers) with details like privileges, roles, and specific assignment permissions (e.g., Chairman, Prayer, Talk, Reader).
*   **Visitor Management:** Track temporary visitors (like visiting speakers) and assign them to meeting parts.
*   **Field Service Group Management:** Define field service groups and assign overseers, assistants, and publishers.
*   **Field Service Meeting Scheduling:** Schedule meetings for field service groups, including date, time, location, conductor, and notes.
*   **Public Talk Title Database:** Store and manage the list of standard public talk titles and numbers.
*   **Congregation Settings:** Configure global settings like congregation name and default meeting days/times.
*   **Payload Admin Panel:** Leverages the powerful Payload CMS admin interface for managing all data.
*   **Authentication & Access Control:** Secure access to the admin panel and potentially different data based on user roles (though currently configured for general authenticated access).
*   **Drafts & Autosave:** Utilizes Payload's versioning system for weekly schedules, allowing drafts and autosave functionality.

## How it Works

The Payload config is tailored for congregation management. Key data structures include:

### Collections

*   **Users (Publishers):** Manages registered congregation members, their details, privileges, congregation roles, and specific permissions for meeting assignments. Authentication is enabled for this collection.
*   **Weeks:** The core collection for scheduling the weekly Midweek and Weekend meetings. It includes detailed fields for all meeting parts, assignments (linking to Users and Visitors), song numbers, talk details, and automatically calculated dates/times based on Congregation Settings. Uses versions for drafts and autosave.
*   **Visitors:** Stores information about temporary visitors (name, congregation) who can be assigned to meeting parts.
*   **Groups:** Defines field service groups, linking to Users for the overseer, assistant, and assigned publishers.
*   **Public Talk Titles:** A list of standard public talk numbers and titles, referenced when scheduling the Weekend Meeting.
*   **Field Service Meetings:** Schedules meetings for field service, linking to the relevant Group and the User conducting.
*   **Media:** Standard Payload collection for managing uploads like images or documents (if needed).

### Globals

*   **Congregation Settings:** Stores global configuration like the congregation's name and the default day/time for Midweek and Weekend meetings.
*   *(Header/Footer globals might exist from the template but are less central to the management features).*

## Quick Start

To spin up this project locally, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url> my-jw-manager
    cd my-jw-manager
    ```
2.  **Environment Variables:**
    ```bash
    cp .env.example .env
    ```
    *Update the `.env` file with your database connection string (`DATABASE_URI`) and a secure `PAYLOAD_SECRET`.*
3.  **Install Dependencies:**
    ```bash
    pnpm install
    ```
4.  **Run Development Server:**
    ```bash
    pnpm dev
    ```
5.  **Access the App:** Open `http://localhost:3000` (or your configured port) in your browser.
6.  **Create Admin User:** Follow the on-screen instructions in the admin panel (`http://localhost:3000/admin`) to create your first administrative user.

## Development Notes

*   Changes made in `./src` will be reflected in your running application during development.
*   Refer to the official [Payload Documentation](https://payloadcms.com/docs) for more details on configuration, extending collections, hooks, access control, etc.

### Working with Databases (if using Postgres/SQL)

*   **Local Development:** The default adapter settings might allow automatic schema pushing (`push: true`). Be cautious if pointing to a shared or production database; set `push: false` in that case.
*   **Migrations:** For production or non-Mongo databases, you'll need to manage schema changes using migrations.
    *   Create a migration: `pnpm payload migrate:create`
    *   Run migrations (typically on the server after building): `pnpm payload migrate`
    *   See [Payload Migrations Docs](https://payloadcms.com/docs/database/migrations).

### Docker

A `docker-compose.yml` file is included.

1.  Ensure your `.env` file is configured.
2.  Run `docker-compose up`.
3.  Access the app and admin panel as described in the Quick Start.

## Production

1.  **Build the Application:**
    ```bash
    pnpm build
    ```
2.  **Run Migrations (if applicable):**
    ```bash
    pnpm payload migrate
    ```
3.  **Start the Server:**
    ```bash
    pnpm start
    ```

## Deployment

*   **Payload Cloud:** The easiest way to deploy Payload projects. See [Payload Cloud](https://payloadcms.com/cloud).
*   **Vercel:** Can be deployed to Vercel, potentially using `@payloadcms/db-vercel-postgres` and `@payloadcms/storage-vercel-blob`. Refer to the original template README sections on Vercel deployment if needed.
*   **Self-hosting:** Deploy as a standard Node.js/Next.js application to your preferred hosting provider (VPS, DigitalOcean Apps, etc.). See [Payload Deployment Docs](https://payloadcms.com/docs/production/deployment).

## Questions

If you have any issues or questions about Payload CMS, reach out on [Discord](https://discord.com/invite/payload) or start a [GitHub discussion](https://github.com/payloadcms/payload/discussions).
