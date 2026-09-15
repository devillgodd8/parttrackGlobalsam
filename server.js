/**
 * Revera Auto - Production Server
 * 
 * Express.js server with clean URL routing, gzip compression,
 * security headers, and static asset caching.
 * 
 * Usage:
 *   npm start          (production)
 *   npm run dev         (development)
 * 
 * Then visit: http://localhost:3000
 */

const express = require('express');
const compression = require('compression');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;
const isProd = process.env.NODE_ENV === 'production';

// ============================================================
// Middleware: Gzip Compression (reduces response size ~70%)
// ============================================================
app.use(compression());

// ============================================================
// Middleware: Security Headers
// ============================================================
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    if (isProd) {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
});

// ============================================================
// API: PartTrack 5-Point Consignment Tracking Endpoint
// ============================================================
app.get('/api/v1/track/:trackingNumber', (req, res) => {
    const rawNum = (req.params.trackingNumber || '').trim();
    const cleanNum = rawNum.replace(/[^a-zA-Z0-9]/g, '');

    if (!cleanNum || cleanNum.length < 6) {
        return res.status(404).json({
            success: false,
            error: 'Invalid tracking number. Please enter a valid 12-digit consignment number.'
        });
    }

    // Specific record lookup for demo and predefined orders
    const mockRecords = {
        '241190101721': {
            current_status: 'In Transit',
            estimated_delivery_date: new Date(Date.now() + 4 * 86400000).toISOString(),
            part_type: 'Remanufactured 5.0L V8 Engine Assembly',
            vehicle: { year: 2021, make: 'Ford', model: 'F-150 Lariat' },
            shipment: { origin: 'Dallas Freight Terminal, TX', destination: 'Sheridan, WY 82801' }
        },
        '100000000001': {
            current_status: 'Processing',
            estimated_delivery_date: new Date(Date.now() + 7 * 86400000).toISOString(),
            part_type: 'Automatic Transmission (6-Speed)',
            vehicle: { year: 2019, make: 'Chevrolet', model: 'Silverado 1500' },
            shipment: { origin: 'Chicago Distribution Center, IL', destination: 'Austin, TX 78701' }
        },
        '100000000002': {
            current_status: 'Delivered',
            estimated_delivery_date: new Date(Date.now() - 1 * 86400000).toISOString(),
            part_type: 'OEM Complete Cylinder Head',
            vehicle: { year: 2020, make: 'Toyota', model: 'Camry SE' },
            shipment: { origin: 'Atlanta Logistics Hub, GA', destination: 'Orlando, FL 32801' }
        }
    };

    if (mockRecords[cleanNum]) {
        return res.json({
            success: true,
            data: mockRecords[cleanNum]
        });
    }

    // Deterministic realistic generation for any valid consignment number
    if (cleanNum.length >= 8 && /^\d+$/.test(cleanNum)) {
        const statuses = ['Processing', 'Pickup', 'In Transit', 'Out for Delivery', 'Delivered'];
        const parts = [
            'Tested OEM Engine Assembly',
            'Heavy-Duty Automatic Transmission',
            'Complete Cylinder Head with Camshafts',
            '4WD Transfer Case Assembly',
            'Turbocharger & Intercooler Unit'
        ];
        const vehicles = [
            { year: 2021, make: 'Ford', model: 'F-150' },
            { year: 2019, make: 'Chevrolet', model: 'Silverado' },
            { year: 2020, make: 'Toyota', model: 'Tundra' },
            { year: 2018, make: 'Dodge', model: 'Ram 1500' },
            { year: 2022, make: 'GMC', model: 'Sierra 1500' }
        ];
        const origins = ['Dallas Logistics Terminal, TX', 'Chicago Distribution Center, IL', 'Atlanta Freight Hub, GA', 'Phoenix Transit Depot, AZ'];
        const destinations = ['Customer Receiving Address', 'Commercial Auto Repair Facility', 'Local Delivery Hub'];

        const numVal = parseInt(cleanNum.slice(-4), 10) || 1234;
        const statusIdx = numVal % statuses.length;
        const partIdx = (numVal >> 2) % parts.length;
        const vehIdx = (numVal >> 3) % vehicles.length;
        const originIdx = (numVal >> 4) % origins.length;
        const destIdx = (numVal >> 5) % destinations.length;

        const daysOffset = statusIdx === 4 ? -1 : (5 - statusIdx);
        const estDate = new Date(Date.now() + daysOffset * 86400000).toISOString();

        return res.json({
            success: true,
            data: {
                tracking_number: cleanNum,
                current_status: statuses[statusIdx],
                estimated_delivery_date: estDate,
                part_type: parts[partIdx],
                vehicle: vehicles[vehIdx],
                shipment: {
                    origin: origins[originIdx],
                    destination: destinations[destIdx]
                }
            }
        });
    }

    return res.status(404).json({
        success: false,
        error: 'Tracking record not found. Please verify your consignment number.'
    });
});

// ============================================================
// Middleware: Redirect .html URLs to clean URLs (301)
// ============================================================
app.use((req, res, next) => {
    // Skip non-GET requests
    if (req.method !== 'GET') return next();

    const urlPath = req.path;

    // Redirect /index.html to /
    if (urlPath === '/index.html') {
        const query = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
        return res.redirect(301, '/' + query);
    }

    // Redirect any .html URL to clean URL
    if (urlPath.endsWith('.html')) {
        const cleanPath = urlPath.slice(0, -5); // Remove .html
        const query = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
        const hash = '';
        return res.redirect(301, cleanPath + query + hash);
    }

    // Remove trailing slash (except for root /)
    if (urlPath.length > 1 && urlPath.endsWith('/')) {
        const cleanPath = urlPath.slice(0, -1);
        const query = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
        return res.redirect(301, cleanPath + query);
    }

    next();
});

// ============================================================
// Middleware: Serve clean URLs by mapping to .html files
// ============================================================
app.use((req, res, next) => {
    // Skip non-GET requests
    if (req.method !== 'GET') return next();

    const urlPath = req.path;

    // Skip URLs that already have a file extension (CSS, JS, images, etc.)
    if (path.extname(urlPath)) return next();

    // Skip the root path (handled by index.html below)
    if (urlPath === '/') return next();

    // Try to find a matching .html file
    const htmlFilePath = path.join(ROOT_DIR, urlPath + '.html');

    if (fs.existsSync(htmlFilePath) && fs.statSync(htmlFilePath).isFile()) {
        return res.sendFile(htmlFilePath);
    }

    // Check if there's an index.html in the directory
    const indexPath = path.join(ROOT_DIR, urlPath, 'index.html');
    if (fs.existsSync(indexPath) && fs.statSync(indexPath).isFile()) {
        return res.sendFile(indexPath);
    }

    next();
});

// ============================================================
// Serve static files with caching (CSS, JS, images, etc.)
// ============================================================
app.use(express.static(ROOT_DIR, {
    extensions: ['html'], // Try .html extension for extensionless requests
    index: 'index.html',
    maxAge: isProd ? '30d' : 0, // Cache static assets for 30 days in production
    etag: true,
    lastModified: true
}));

// ============================================================
// 404 Handler
// ============================================================
app.use((req, res) => {
    const notFoundPage = path.join(ROOT_DIR, '404.html');
    if (fs.existsSync(notFoundPage)) {
        res.status(404).sendFile(notFoundPage);
    } else {
        res.status(404).sendFile(path.join(ROOT_DIR, 'index.html'));
    }
});

// ============================================================
// Start Server
// ============================================================
app.listen(PORT, () => {
    console.log(`\n🚀 Revera Auto Server`);
    console.log(`   Mode: ${isProd ? 'PRODUCTION' : 'DEVELOPMENT'}`);
    console.log(`   Running at: http://localhost:${PORT}`);
    console.log(`\n📋 Clean URL Routing Active:`);
    console.log(`   /about-us.html  →  301 →  /about-us`);
    console.log(`   /contact-us.html  →  301 →  /contact-us`);
    console.log(`   /index.html  →  301 →  /`);
    if (isProd) {
        console.log(`\n🔒 Production optimizations enabled:`);
        console.log(`   ✓ Gzip compression`);
        console.log(`   ✓ Security headers`);
        console.log(`   ✓ Static asset caching (30 days)`);
    }
    console.log(`\n   Press Ctrl+C to stop\n`);
});
