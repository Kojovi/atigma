<?php
require_once __DIR__ . '/auth.php';

handle_preflight();
$pdo = get_pdo();
$method = $_SERVER['REQUEST_METHOD'];

function next_product_id($pdo) {
    $rows = $pdo->query('SELECT id FROM products')->fetchAll();
    $max = 0;
    foreach ($rows as $row) {
        if (preg_match('/P-(\d+)/', $row['id'], $m)) {
            $max = max($max, (int)$m[1]);
        }
    }
    return 'P-' . str_pad((string)($max + 1), 4, '0', STR_PAD_LEFT);
}

function fetch_all_products($pdo) {
    $products = $pdo->query(
        'SELECT id, name, price, description, sold_out, created_at FROM products ORDER BY created_at DESC'
    )->fetchAll();

    $images = $pdo->query(
        'SELECT product_id, image_data FROM product_images ORDER BY product_id, sort_order ASC'
    )->fetchAll();

    $imagesByProduct = [];
    foreach ($images as $img) {
        $imagesByProduct[$img['product_id']][] = $img['image_data'];
    }

    return array_map(function ($p) use ($imagesByProduct) {
        return [
            'id' => $p['id'],
            'name' => $p['name'],
            'price' => (float)$p['price'],
            'description' => $p['description'] ?? '',
            'soldOut' => (bool)$p['sold_out'],
            'images' => $imagesByProduct[$p['id']] ?? [],
        ];
    }, $products);
}

function find_product($products, $id) {
    foreach ($products as $p) {
        if ($p['id'] === $id) return $p;
    }
    return null;
}

// ---------- GET: public, list every product ----------
if ($method === 'GET') {
    json_response(200, ['products' => fetch_all_products($pdo)]);
}

// Every other method changes data, so it requires an admin token.
if (!require_admin()) {
    json_response(401, ['error' => 'Admin login required.']);
}

$body = read_json_body();

// ---------- POST: create a new product ----------
if ($method === 'POST') {
    $name = $body['name'] ?? null;
    $price = $body['price'] ?? null;
    $description = $body['description'] ?? '';
    $images = is_array($body['images'] ?? null) ? array_slice($body['images'], 0, 5) : [];

    if (!$name || $price === null) {
        json_response(400, ['error' => 'Name and price are required.']);
    }

    $id = next_product_id($pdo);
    $pdo->prepare('INSERT INTO products (id, name, price, description, sold_out) VALUES (?, ?, ?, ?, 0)')
        ->execute([$id, $name, (float)$price, $description]);

    $imgStmt = $pdo->prepare('INSERT INTO product_images (product_id, image_data, sort_order) VALUES (?, ?, ?)');
    foreach ($images as $i => $img) {
        $imgStmt->execute([$id, $img, $i]);
    }

    $products = fetch_all_products($pdo);
    json_response(201, ['product' => find_product($products, $id), 'products' => $products]);
}

// ---------- PUT: update an existing product ----------
if ($method === 'PUT') {
    $id = $body['id'] ?? null;
    if (!$id) json_response(400, ['error' => 'Product id is required.']);

    $existsStmt = $pdo->prepare('SELECT id FROM products WHERE id = ?');
    $existsStmt->execute([$id]);
    if (!$existsStmt->fetch()) json_response(404, ['error' => 'Product not found.']);

    $fields = [];
    $values = [];
    if (array_key_exists('name', $body) && $body['name']) { $fields[] = 'name = ?'; $values[] = $body['name']; }
    if (array_key_exists('price', $body) && $body['price'] !== null) { $fields[] = 'price = ?'; $values[] = (float)$body['price']; }
    if (array_key_exists('description', $body)) { $fields[] = 'description = ?'; $values[] = $body['description']; }
    if (array_key_exists('soldOut', $body)) { $fields[] = 'sold_out = ?'; $values[] = $body['soldOut'] ? 1 : 0; }

    if (count($fields) > 0) {
        $values[] = $id;
        $pdo->prepare('UPDATE products SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($values);
    }

    // If images were sent, replace the full set (matches the admin UI,
    // which stages the complete gallery before saving).
    if (array_key_exists('images', $body) && is_array($body['images'])) {
        $pdo->prepare('DELETE FROM product_images WHERE product_id = ?')->execute([$id]);
        $images = array_slice($body['images'], 0, 5);
        $imgStmt = $pdo->prepare('INSERT INTO product_images (product_id, image_data, sort_order) VALUES (?, ?, ?)');
        foreach ($images as $i => $img) {
            $imgStmt->execute([$id, $img, $i]);
        }
    }

    $products = fetch_all_products($pdo);
    json_response(200, ['product' => find_product($products, $id), 'products' => $products]);
}

// ---------- DELETE: remove a product ----------
if ($method === 'DELETE') {
    $id = $body['id'] ?? null;
    if (!$id) json_response(400, ['error' => 'Product id is required.']);

    $pdo->prepare('DELETE FROM products WHERE id = ?')->execute([$id]);
    json_response(200, ['products' => fetch_all_products($pdo)]);
}

json_response(405, ['error' => 'Method not allowed']);
