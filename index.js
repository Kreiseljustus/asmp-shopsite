const express = require('express');
const app = express();
const fs = require("fs");
const path = require('path');
const LOG_FILE = path.join(__dirname, 'server.log');

function logToFile(level, ...args) {
    const timestamp = new Date().toISOString();
    const message = args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
    fs.appendFileSync(LOG_FILE, `[${timestamp}] [${level}] ${message}\n`, 'utf-8');
}

/*const origLog = console.log;
const origError = console.error;
const origWarn = console.warn;
const origInfo = console.info;

console.log = (...args) => {
    logToFile('LOG', ...args);
    origLog(...args);
};
console.error = (...args) => {
    logToFile('ERROR', ...args);
    origError(...args);
};
console.warn = (...args) => {
    logToFile('WARN', ...args);
    origWarn(...args);
};
console.info = (...args) => {
    logToFile('INFO', ...args);
    origInfo(...args);
};*/

app.use(express.json());

const DATA_DIR = path.join(__dirname, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });
app.use(express.static(path.join(__dirname, 'public')));

const FILE_PATH = path.join(DATA_DIR, 'items.json');
const WAYSTONES_PATH = path.join(DATA_DIR, 'waystones.json');
const IGNORED_WAYSTONES_PATH = path.join(DATA_DIR, 'ignoredWaystones.json');
const IGNORED_SHOPS_PATH = path.join(DATA_DIR, 'ignoredShops.json');
const NEWS_PATH = path.join(DATA_DIR, 'news.json');
const GRAPHS_PATH = path.join(DATA_DIR, 'graphs.json');
const VISITS_FILE = path.join(DATA_DIR, 'visits.txt');
const USERNAME_FILE = path.join(DATA_DIR, 'username.txt');

let items = loadItems();
let waystones = loadWaystones();
let ignoredWaystones = loadIgnoredWaystones();
let ignoredShops = loadIgnoredShops();
let news = loadNews();
let graphs = loadGraphs();
setInterval(() => {
    waystones = loadWaystones();
    ignoredWaystones = loadIgnoredWaystones();
    ignoredShops = loadIgnoredShops();
    news = loadNews();
    graphs = loadGraphs();
}, 30000);

app.get('/', (req, res) => {
    console.log("GET / opened");
    res.redirect('/shops');
});

app.get('/shops', (req, res) => {
    console.log("GET /shops opened");
    incrementVisit('shops');
    let html = fs.readFileSync(path.join(__dirname, 'views', 'index.html'), 'utf-8');
    // Inject items, priceHistory, and news as JSON into the template
    html = html.replace('<!--ITEMS_JSON-->', JSON.stringify(items));
    html = html.replace('<!--NEWS_JSON-->', JSON.stringify(news));
    res.send(html);
});

app.get('/waytones', (req, res) => {
    console.log("GET /waytones opened");
    incrementVisit('waytones');
    let html = fs.readFileSync(path.join(__dirname, 'views', 'waytones.html'), 'utf-8');
    html = html.replace('<!--WAYSTONES_JSON-->', JSON.stringify(waystones));
    html = html.replace('<!--NEWS_JSON-->', JSON.stringify(news));
    res.send(html);
});

app.get('/graphs', (req, res) => {
    console.log("GET /graphs opened");
    incrementVisit('graphs');
    let html = fs.readFileSync(path.join(__dirname, 'views', 'graphs.html'), 'utf-8');
    html = html.replace('<!--NEWS_JSON-->', JSON.stringify(news));
    html = html.replace('<!--GRAPHS_JSON-->', JSON.stringify(graphs));
    res.send(html);
});

/*app.get('/waystones', (req, res) => {
    console.log("GET /waystones opened");
    incrementVisit('waystones');
    res.json(waystones);
});*/

app.get('/api/waystones', (req, res) => {
    console.log("GET /api/waystones opened");
    res.json(waystones);
});

app.get('/api/shops', (req, res) => {
    console.log("GET /api/shops opened");
    res.json(items);
});

app.get('/api/graphs', (req, res) => {
    console.log("GET /api/graphs opened");
    res.json(graphs);
});

app.post('/api/graphs', (req, res) => {
    console.log("POST /api/graphs with body:", JSON.stringify(req.body));
    const { graph, value } = req.body;
    
    if (!graph || value === undefined) {
        return res.status(400).json({ error: 'Missing graph or value in request body.' });
    }
    
    // Find the graph entry or create it
    const graphIndex = graphs.graphs.findIndex(g => g.graph === graph);
    
    if (graphIndex !== -1) {
        graphs.graphs[graphIndex].value = value;
    } else {
        graphs.graphs.push({ graph, value });
    }
    
    saveGraphs();
    res.json({ success: true, message: 'Graph value updated.' });
});

app.post('/api/post', (req, res) => {
    console.log("POST /api/post with body:", JSON.stringify(req.body));
    
    // Backwards compatibility: handle multiple formats
    // Old format: [shops...] (array of shops)
    // New format: { shops: [...] } (just shops)
    // New format: { waystones: [...] } (just waystones)
    // New format: { shops: [...], waystones: [...] } (both)
    let shopsData = [];
    let waystonesData = [];
    
    if (Array.isArray(req.body)) {
        // Old format: just shops array
        shopsData = req.body;
        waystonesData = [];
    } else if (req.body && typeof req.body === 'object') {
        // New format: object with shops and/or waystones
        if (Array.isArray(req.body.shops)) {
            shopsData = req.body.shops;
        }
        if (Array.isArray(req.body.waystones)) {
            waystonesData = req.body.waystones;
        }
        
        // Validate that at least one is provided
        if (!Array.isArray(req.body.shops) && !Array.isArray(req.body.waystones)) {
            console.log("Invalid data format: " + JSON.stringify(req.body))
            return res.status(400).send("Invalid data format. Expected { shops: [...] }, { waystones: [...] }, { shops: [...], waystones: [...] }, or [shops...]");
        }
    } else {
        console.log("Invalid data format: " + JSON.stringify(req.body))
        return res.status(400).send("Invalid data format. Expected { shops: [...] }, { waystones: [...] }, { shops: [...], waystones: [...] }, or [shops...]");
    }

    // Filter out ignored shopsnd
    shopsData = shopsData.filter(item => !isShopIgnored(item));
    // Filter out ignored waystones
    waystonesData = waystonesData.filter(ws => !isWaystoneIgnored(ws));

    // Handle shops
    let newItems = shopsData.map(item => ({
    Owner: item.Owner,
    position: item.position,
    price: item.price,
    item: item.item,
    amount: item.amount,
    dimension: normalizeDimension(item.dimension),
    action: item.action,
    updateTime: new Date().toISOString(),
    ...(item.updateTime !== undefined && { updateTime: item.updateTime })
}));

    // Update existing items or add new ones
    newItems.forEach(newItem => {
        const existingItemIndex = items.findIndex(item => 
            JSON.stringify(item.position) === JSON.stringify(newItem.position)
        );
        if (existingItemIndex !== -1) {
            items[existingItemIndex] = newItem;
        } else {
            items.push(newItem);
        }
    });

    saveItems();

    // Handle waystones (only if waystones data is provided)
    if (waystonesData.length > 0) {
        let updatedWaystones = [...waystones];
        for (const ws of waystonesData) {
            // Check for 3x3x3 proximity in updatedWaystones (old + already-accepted new)

            if(ws.Name.length > 50) {
                console.log("Waystone name is too long: " + ws.Name);
                ws.Name = ws.Name.slice(0, 50);
            }

            // Check if the waystone is already in the list 
            if (updatedWaystones.some(existing =>
                Math.abs(existing.position[0] - ws.position[0]) <= 1 &&
                Math.abs(existing.position[1] - ws.position[1]) <= 1 &&
                Math.abs(existing.position[2] - ws.position[2]) <= 1
            )) {
                continue;
            }
            updatedWaystones.push({
                Owner: ws.Owner,
                Name: ws.Name,
                position: ws.position,
                dimension: normalizeDimension(ws.dimension)
            });
        }
        waystones = updatedWaystones;
        saveWaystones();
    }

    res.status(200).send("Data received and stored.");
});

app.post('/api/delete', (req, res) => {
    console.log("POST /api/delete with body:", JSON.stringify(req.body));
    const { type, data } = req.body;
    if (!type || !data) {
        return res.status(400).json({ error: 'Missing type or data in request body.' });
    }
    if (type === 'shop') {
        // Identify shop by Owner, item, and position
        const before = items.length;
        items = items.filter(item =>
            !(item.Owner === data.Owner &&
              item.item === data.item &&
              Array.isArray(item.position) && Array.isArray(data.position) &&
              item.position.length === data.position.length &&
              item.position.every((v, i) => v === data.position[i])
            )
        );
        if (items.length < before) {
            saveItems();
            return res.json({ success: true, message: 'Shop deleted.' });
        } else {
            return res.status(404).json({ error: 'Shop not found.' });
        }
    } else if (type === 'waystone') {
        // Identify waystone by Owner, Name, and position
        const before = waystones.length;
        waystones = waystones.filter(ws =>
            !(ws.Owner === data.Owner &&
              ws.Name === data.Name &&
              Array.isArray(ws.position) && Array.isArray(data.position) &&
              ws.position.length === data.position.length &&
              ws.position.every((v, i) => v === data.position[i])
            )
        );
        if (waystones.length < before) {
            saveWaystones();
            return res.json({ success: true, message: 'Waystone deleted.' });
        } else {
            return res.status(404).json({ error: 'Waystone not found.' });
        }
    } else {
        return res.status(400).json({ error: 'Invalid type. Must be "shop" or "waystone".' });
    }
});

app.post('/api/username', (req, res) => {
    const { username } = req.body;
    if (typeof username !== 'string' || !username.trim()) {
        console.log(`[USERNAME FAIL] Invalid or missing username. Received body:`, req.body);
        return res.status(400).json({ success: false, message: 'Invalid or missing username.' });
    }
    fs.appendFileSync(USERNAME_FILE, username + '\n', 'utf-8');
    console.log(`[USERNAME SUCCESS] Username saved: '${username}'`);
    res.json({ success: true, message: 'Username saved.' });
});

app.use((req, res) => {
    res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Page Not Found</title>
            <link rel="stylesheet" href="/css/404.css">
        </head>
        <body>
            <h1>404 - Page Not Found</h1>
            <p>The page you're looking for doesn't exist.</p>
            <p>Requested path: ${req.path}</p>
        </body>
        </html>
    `);
});

app.listen(49876, () => console.log('Server running on port 49876'));

/**
 * Canonical storage: 0 Overworld, 1 Nether, 2 End (matches ASMP Utils:
 * the_nether -> 1, the_end -> 2, default -> 0).
 * Also accepts registry strings or -1 for older/malformed payloads so existing JSON still loads.
 */
function normalizeDimension(d) {
    if (d === null || d === undefined || d === '') return null;
    if (typeof d === 'string') {
        const s = d.toLowerCase().replace(/^minecraft:/i, '').trim();
        if (s === 'overworld') return 0;
        if (s === 'the_nether' || s === 'nether') return 1;
        if (s === 'the_end' || s === 'end') return 2;
        const n = Number(s);
        if (!Number.isNaN(n)) return normalizeDimension(n);
        console.warn('[dimension] unrecognized string:', d);
        return null;
    }
    const n = Number(d);
    if (Number.isNaN(n)) return null;
    if (n === 0) return 0;
    if (n === 1) return 1;
    if (n === 2) return 2;
    if (n === -1) return 1;
    console.warn('[dimension] unrecognized number:', n);
    return null;
}

function loadItems() {
    if (fs.existsSync(FILE_PATH)) {
        const data = fs.readFileSync(FILE_PATH, 'utf-8');
        const raw = JSON.parse(data);
        let needsSave = false;
        const next = raw.map(item => {
            const d = normalizeDimension(item.dimension);
            if (d !== item.dimension) {
                needsSave = true;
                return { ...item, dimension: d };
            }
            return item;
        });
        if (needsSave) {
            fs.writeFileSync(FILE_PATH, JSON.stringify(next, null, 2), 'utf-8');
        }
        return next;
    }
    return [];
}

function saveItems() {
    fs.writeFileSync(FILE_PATH, JSON.stringify(items, null, 2), 'utf-8');
}

function loadWaystones() {
    if (fs.existsSync(WAYSTONES_PATH)) {
        const data = fs.readFileSync(WAYSTONES_PATH, 'utf-8');
        const waystones = JSON.parse(data);
        let needsSave = false;
        waystones.forEach(ws => {
            if (ws.Name && ws.Name.length > 50) {
                ws.Name = ws.Name.slice(0, 50);
                needsSave = true;
            }
            const d = normalizeDimension(ws.dimension);
            if (d !== ws.dimension) {
                ws.dimension = d;
                needsSave = true;
            }
        });
        if (needsSave) {
            fs.writeFileSync(WAYSTONES_PATH, JSON.stringify(waystones, null, 2), 'utf-8');
        }
        return waystones;
    }
    return [];
}

function saveWaystones() {
    fs.writeFileSync(WAYSTONES_PATH, JSON.stringify(waystones, null, 2), 'utf-8');
}

function loadIgnoredWaystones() {
    if (fs.existsSync(IGNORED_WAYSTONES_PATH)) {
        const data = fs.readFileSync(IGNORED_WAYSTONES_PATH, 'utf-8');
        return JSON.parse(data);
    }
    return [];
}
function loadIgnoredShops() {
    if (fs.existsSync(IGNORED_SHOPS_PATH)) {
        const data = fs.readFileSync(IGNORED_SHOPS_PATH, 'utf-8');
        return JSON.parse(data);
    }
    return [];
}
function isWaystoneIgnored(ws) {
    // Check by Owner+Name+position
    return ignoredWaystones.some(ignored =>
        ignored.Owner === ws.Owner &&
        ignored.Name === ws.Name &&
        Array.isArray(ignored.position) && Array.isArray(ws.position) &&
        ignored.position.length === ws.position.length &&
        ignored.position.every((v, i) => v === ws.position[i])
    );
}
function isShopIgnored(shop) {
    // Check by Owner+item+position
    return ignoredShops.some(ignored =>
        ignored.Owner === shop.Owner &&
        ignored.item === shop.item &&
        Array.isArray(ignored.position) && Array.isArray(shop.position) &&
        ignored.position.length === shop.position.length &&
        ignored.position.every((v, i) => v === shop.position[i])
    );
}

function getToday() {
    return new Date().toISOString().slice(0, 10);
}

function loadVisits() {
    if (fs.existsSync(VISITS_FILE)) {
        const data = fs.readFileSync(VISITS_FILE, 'utf-8');
        try {
            const parsed = JSON.parse(data);
            if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
                return parsed;
            }
        } catch (e) {
            // If not JSON, migrate from old format (single number)
            const today = getToday();
            const count = parseInt(data);
            if (!isNaN(count)) {
                const migrated = { [today]: { shops: count } };
                saveVisits(migrated); // Save migration immediately
                return migrated;
            }
        }
    }
    return {};
}

function saveVisits(visits) {
    fs.writeFileSync(VISITS_FILE, JSON.stringify(visits, null, 2), 'utf-8');
}

function incrementVisit(page) {
    const today = getToday();
    let visits = loadVisits();
    if (!visits[today]) visits[today] = {};
    if (!visits[today][page]) visits[today][page] = 0;
    visits[today][page]++;
    saveVisits(visits);
}

function loadNews() {
    if (fs.existsSync(NEWS_PATH)) {
        const data = fs.readFileSync(NEWS_PATH, 'utf-8');
        return JSON.parse(data);
    }
    return { news: [] };
}

function loadGraphs() {
    if (fs.existsSync(GRAPHS_PATH)) {
        const data = fs.readFileSync(GRAPHS_PATH, 'utf-8');
        return JSON.parse(data);
    }
    return { graphs: [] };
}

function saveGraphs() {
    fs.writeFileSync(GRAPHS_PATH, JSON.stringify(graphs, null, 2), 'utf-8');
}