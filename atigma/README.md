# Atigma — PHP + MySQL Version

This is the same live catalogue site, rebuilt to run on **any standard PHP +
MySQL hosting** — the kind that comes with cPanel and phpMyAdmin, which is
the cheapest and most widely available hosting for a small business site.
No Node.js, no build step, no special hosting features required.

It also runs on your own computer via a free local server tool (XAMPP or
MAMP), using the *exact same files* you'd later upload to real hosting.

## How it's organized

```
atigma-site-php/
├── index.html, about.html, contact.html, admin.html    Pages
├── css/style.css                                          Shared styling
├── js/                                                      Frontend logic (same as before)
├── images/logo.png                                            Static brand logo
├── api/
│   ├── config.php        Your database credentials go here
│   ├── auth.php            Admin token + JSON response helpers
│   ├── admin-login.php       Passcode check -> token
│   ├── products.php            List/create/update/delete products
│   └── settings.php              Contact info, socials, theme, passcode
├── db/schema.sql          Import this once through phpMyAdmin
└── .htaccess                 Basic hardening
```

Images are stored directly in MySQL (as base64 text), for the same reason
as before: it keeps everything in one backend you already have, with
nothing extra to configure.

## Part 1 — Test it on your own computer first

1. **Install a local server tool.** [XAMPP](https://www.apachefriends.org)
   (Windows/Mac/Linux) or [MAMP](https://www.mamp.info) (Mac/Windows) both
   bundle Apache, PHP, MySQL, and phpMyAdmin together — install one of these.
2. **Start Apache and MySQL** from the XAMPP/MAMP control panel.
3. **Copy this whole `atigma-site-php` folder** into XAMPP's `htdocs` folder
   (on MAMP, the `htdocs` folder inside the MAMP install).
4. **Open phpMyAdmin** (usually `http://localhost/phpmyadmin`).
   - Create a new database named `atigma`.
   - Click the "Import" tab, choose `db/schema.sql`, and run it. This
     creates the tables and fills in starter values.
5. **Edit `api/config.php`** — the local defaults (`localhost`, user `root`,
   empty password) match XAMPP/MAMP's out-of-the-box MySQL setup, so you
   often won't need to change anything for local testing.
6. **Visit `http://localhost/atigma-site-php/index.html`** in your browser.
   The catalogue should load (empty, until you add products).
7. Go to `http://localhost/atigma-site-php/admin.html`, log in with the
   starting passcode `admin123`, and try adding a product — it should
   appear on the catalogue page immediately.

If this all works locally, you're ready for real hosting — nothing about
the files needs to change.

## Part 2 — Move it to live shared hosting

1. **Buy hosting that includes PHP and MySQL** (essentially all cheap
   shared hosting does — look for cPanel in the description).
2. **Create a MySQL database** from your host's cPanel:
   *MySQL Databases* → create a database and a database user, and note the
   database name, username, password, and host (often `localhost`, but your
   host's dashboard will tell you if it's different).
3. **Open phpMyAdmin from cPanel**, select your new database, go to
   *Import*, and upload `db/schema.sql` — same as the local step.
4. **Edit `api/config.php`** with the real database name, user, password,
   and host your cPanel gave you. Also change `ADMIN_TOKEN_SECRET` to a
   long random string (any long random text works).
5. **Upload the whole folder** to your hosting account — either via cPanel's
   *File Manager* (zip it, upload, then extract) or FTP — into
   `public_html` (or a subfolder, if you want the site at a sub-path).
6. Visit your domain. That's it — no build step, no deploy pipeline.

## Log in as admin

Go to `/admin.html` on your site. Starting passcode:

```
admin123
```

**Change it immediately** from the dashboard's "Change admin passcode"
field once you're in.

⚠️ Security notes:

- **The passcode is hashed, not stored in plain text.** It's hashed with
  bcrypt (PHP's `password_hash()`) the moment you first log in successfully
  or set a new one — you never need to hash it yourself, and it's never
  stored or sent back in readable form.
- **Login attempts are rate-limited.** After 5 wrong passcodes from the
  same IP address, that IP is locked out for 15 minutes.
- **The admin login token is signed, not encrypted** — that's normal and
  correct for this kind of token. It only carries a role and an expiry
  time, nothing sensitive, so it just needs to be tamper-proof (which the
  signature guarantees), not hidden.
- **Use HTTPS once this is live.** On localhost this doesn't matter, but on
  real hosting, make sure your domain has an SSL certificate (cPanel's
  "AutoSSL" / Let's Encrypt is free and usually one click) so the passcode
  and admin token aren't sent in the clear over the network.

## Requirements

- PHP 7.4 or newer (virtually all current hosting has this; check your
  host's cPanel "MultiPHP Manager" if you're unsure which version is active)
- MySQL 5.7+ / MariaDB 10.2+
- The `pdo_mysql` PHP extension, which is enabled by default on nearly
  every host

## Everyday use

Exactly the same as before: add/edit/delete products and mark them sold
out, change the site theme, update contact info and social links, and set
the founder photo — all from `/admin.html`, all live immediately for every
visitor. Customers can click any product for its full photo gallery and
send an Order (in stock) or Preorder (sold out) request straight to your
WhatsApp or email.
