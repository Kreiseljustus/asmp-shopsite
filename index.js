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

app.use(express.json({ limit: '10mb' }));

const DATA_DIR = path.join(__dirname, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });
app.use(express.static(path.join(__dirname, 'public')));

const FILE_PATH = path.join(DATA_DIR, 'items.json');
const WAYSTONES_PATH = path.join(DATA_DIR, 'waystones.json');
const IGNORED_WAYSTONES_PATH = path.join(DATA_DIR, 'ignoredWaystones.json');
const IGNORED_SHOPS_PATH = path.join(DATA_DIR, 'ignoredShops.json');
const IGNORED_USERNAMES_PATH = path.join(DATA_DIR, 'ignoredUsernames.json');
const NEWS_PATH = path.join(DATA_DIR, 'news.json');
const GRAPHS_PATH = path.join(DATA_DIR, 'graphs.json');
const VISITS_FILE = path.join(DATA_DIR, 'visits.txt');
const USERNAME_FILE = path.join(DATA_DIR, 'username.txt');
const STATISTICS_FOLDER = path.join(DATA_DIR, 'statistics');
const STATISTICS_CATEGORIES_PATH = path.join(STATISTICS_FOLDER, 'categories.json');
const STATISTICS_PLAYERS_PATH = path.join(STATISTICS_FOLDER, 'players.json');

ensureStatisticsFiles();

let items = loadItems();
let waystones = loadWaystones();
let ignoredWaystones = loadIgnoredWaystones();
let ignoredShops = loadIgnoredShops();
let ignoredUsernames = loadIgnoredUsernames();
let news = loadNews();
let graphs = loadGraphs();
purgeIgnoredUserData();
setInterval(() => {
    waystones = loadWaystones();
    ignoredWaystones = loadIgnoredWaystones();
    ignoredShops = loadIgnoredShops();
    ignoredUsernames = loadIgnoredUsernames();
    news = loadNews();
    graphs = loadGraphs();
    purgeIgnoredUserData();
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

app.get('/info', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'info.html'));
});

app.get('/statistics', (req, res) => {
    console.log("GET /statistics opened");
    incrementVisit('statistics');

    const { categories, rankingsBySlug } = getStatisticsData();
    const overviewCategories = categories.map(category => {
        const leaderboard = rankingsBySlug[category.slug] || [];
        return {
            ...category,
            topEntries: leaderboard.slice(0, 3),
            participants: leaderboard.length
        };
    });

    let html = fs.readFileSync(path.join(__dirname, 'views', 'statistics.html'), 'utf-8');
    html = html.replace('<!--STAT_OVERVIEW_JSON-->', JSON.stringify(overviewCategories));
    html = html.replace('<!--STAT_DETAIL_JSON-->', JSON.stringify(null));
    res.send(html);
});

app.get('/statistics/:categorySlug', (req, res) => {
    const { categorySlug } = req.params;
    console.log(`GET /statistics/${categorySlug} opened`);
    incrementVisit('statistics');

    const { categories, rankingsBySlug } = getStatisticsData();
    const category = categories.find(c => c.slug === categorySlug);

    if (!category) {
        return res.status(404).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Category Not Found</title>
                <link rel="stylesheet" href="/css/404.css">
            </head>
            <body>
                <h1>404 - Category Not Found</h1>
                <p>The statistics category "${categorySlug}" does not exist.</p>
                <p><a href="/statistics">Back to statistics</a></p>
            </body>
            </html>
        `);
    }

    const detailData = {
        ...category,
        leaderboard: rankingsBySlug[category.slug] || []
    };

    let html = fs.readFileSync(path.join(__dirname, 'views', 'statistics.html'), 'utf-8');
    html = html.replace('<!--STAT_OVERVIEW_JSON-->', JSON.stringify(categories));
    html = html.replace('<!--STAT_DETAIL_JSON-->', JSON.stringify(detailData));
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

app.post('/api/shops', (req, res) => {
    console.log("POST /api/shops with body:", JSON.stringify(req.body));
    
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
    shopsData = shopsData.filter(item => !isUsernameIgnored(extractOwnerName(item.Owner)));
    waystonesData = waystonesData.filter(ws => !isUsernameIgnored(extractOwnerName(ws.Owner)));

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

app.post('/api/statistics', (req, res) => {
    const { username, userUUID, statisticsJson } = req.body || {};

    if (typeof username !== 'string' || !username.trim()) {
        console.log('[STATISTICS FAIL] Missing/invalid username:', req.body);
        return res.status(400).json({ success: false, message: 'Missing or invalid username.' });
    }

    if (typeof statisticsJson !== 'string' || !statisticsJson.trim()) {
        console.log('[STATISTICS FAIL] Missing/invalid statisticsJson for:', username);
        return res.status(400).json({ success: false, message: 'Missing or invalid statisticsJson.' });
    }

    try {
        JSON.parse(statisticsJson);
    } catch (error) {
        console.log('[STATISTICS FAIL] statisticsJson is not valid JSON:', error.message);
        return res.status(400).json({ success: false, message: 'statisticsJson must be valid JSON.' });
    }

    const normalizedUsername = username.trim();
    if (isUsernameIgnored(normalizedUsername)) {
        return res.status(403).json({ success: false, message: 'Username is ignored.' });
    }
    const normalizedUuid = typeof userUUID === 'string' ? userUUID.trim() : '';

    const players = loadStatisticsPlayers();
    const existingIndex = players.findIndex(player => {
        if (normalizedUuid && typeof player.userUUID === 'string') {
            return player.userUUID === normalizedUuid;
        }
        return typeof player.username === 'string' && player.username.toLowerCase() === normalizedUsername.toLowerCase();
    });

    const playerEntry = {
        username: normalizedUsername,
        userUUID: normalizedUuid || undefined,
        stat_string: statisticsJson,
        updatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
        players[existingIndex] = {
            ...players[existingIndex],
            ...playerEntry
        };
    } else {
        players.push(playerEntry);
    }

    saveStatisticsPlayers(players);
    console.log(`[STATISTICS SUCCESS] Stored statistics for '${normalizedUsername}'`);
    return res.json({ success: true, message: 'Statistics stored.', totalPlayers: players.length });
});

app.post('/api/statistics/categoriesUpdate', (req, res) => {
    const categories = req.body;
    if (!Array.isArray(categories)) {
        return res.status(400).json({ success: false, message: 'Body must be an array of categories.' });
    }

    for (let i = 0; i < categories.length; i++) {
        const category = categories[i];
        if (!category || typeof category !== 'object' || Array.isArray(category)) {
            return res.status(400).json({ success: false, message: `Category at index ${i} must be an object.` });
        }
        if (typeof category.title !== 'string' || !category.title.trim()) {
            return res.status(400).json({ success: false, message: `Category at index ${i} is missing a valid title.` });
        }
        if (typeof category.stat !== 'string' || !category.stat.trim()) {
            return res.status(400).json({ success: false, message: `Category at index ${i} is missing a valid stat.` });
        }
        if (category.description !== undefined && typeof category.description !== 'string') {
            return res.status(400).json({ success: false, message: `Category at index ${i} has invalid description.` });
        }
        if (category.icon_file !== undefined && typeof category.icon_file !== 'string') {
            return res.status(400).json({ success: false, message: `Category at index ${i} has invalid icon_file.` });
        }
    }

    fs.writeFileSync(STATISTICS_CATEGORIES_PATH, JSON.stringify(categories, null, 2), 'utf-8');
    return res.json({ success: true, message: 'Categories updated.', totalCategories: categories.length });
});

app.post('/api/statistics/ignoredUsernamesUpdate', (req, res) => {
    const usernames = req.body;
    if (!Array.isArray(usernames)) {
        return res.status(400).json({ success: false, message: 'Body must be an array of usernames.' });
    }

    const normalized = usernames
        .filter(entry => typeof entry === 'string')
        .map(entry => entry.trim())
        .filter(Boolean);

    if (normalized.length !== usernames.length) {
        return res.status(400).json({ success: false, message: 'All usernames must be non-empty strings.' });
    }

    fs.writeFileSync(
        IGNORED_USERNAMES_PATH,
        JSON.stringify(normalized, null, 2),
        'utf-8'
    );
    ignoredUsernames = normalized.map(name => name.toLowerCase());
    purgeIgnoredUserData();
    return res.json({ success: true, message: 'Ignored usernames updated.', totalUsernames: normalized.length });
});

app.get('/api/statistics/players', (req, res) => {
    return res.json(loadStatisticsPlayers());
});

app.get('/api/statistics/categories', (req, res) => {
    return res.json(loadStatisticsCategories());
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

app.use((err, req, res, next) => {
    if (err && err.type === 'entity.too.large') {
        return res.status(413).json({
            success: false,
            message: 'MONKA, request to large :c'
        });
    }
    return next(err);
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
function loadIgnoredUsernames() {
    if (!fs.existsSync(IGNORED_USERNAMES_PATH)) {
        fs.writeFileSync(IGNORED_USERNAMES_PATH, JSON.stringify([], null, 2), 'utf-8');
        return [];
    }

    try {
        const data = fs.readFileSync(IGNORED_USERNAMES_PATH, 'utf-8');
        const parsed = JSON.parse(data);
        if (!Array.isArray(parsed)) return [];
        return parsed
            .filter(entry => typeof entry === 'string')
            .map(entry => entry.trim().toLowerCase())
            .filter(Boolean);
    } catch (error) {
        console.error('Failed to load ignored usernames:', error.message);
        return [];
    }
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

function isUsernameIgnored(username) {
    if (typeof username !== 'string') return false;
    return ignoredUsernames.includes(username.trim().toLowerCase());
}

function extractOwnerName(owner) {
    if (typeof owner !== 'string') return '';
    return owner.replace(/^owner:\s*/i, '').trim();
}

function purgeIgnoredUserData() {
    const beforeItems = items.length;
    const beforeWaystones = waystones.length;

    items = items.filter(item => !isUsernameIgnored(extractOwnerName(item.Owner)));
    waystones = waystones.filter(ws => !isUsernameIgnored(extractOwnerName(ws.Owner)));

    if (items.length !== beforeItems) saveItems();
    if (waystones.length !== beforeWaystones) saveWaystones();

    const players = loadStatisticsPlayers();
    const filteredPlayers = players.filter(player => !isUsernameIgnored(player.username || ''));
    if (filteredPlayers.length !== players.length) {
        saveStatisticsPlayers(filteredPlayers);
    }
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

function ensureStatisticsFiles() {
    fs.mkdirSync(STATISTICS_FOLDER, { recursive: true });

    if (!fs.existsSync(STATISTICS_CATEGORIES_PATH)) {
        const starterCategories = [
            {
                title: "Cow Tipper",
                stat: "minecraft:mob_killed_cow",
                description: "Most cows killed",
                icon_file: "/icons/cow_tipper.png"
            },
            {
                title: "Tree Puncher",
                stat: "minecraft:mined_minecraft:oak_log",
                description: "Most oak logs mined",
                icon_file: "/icons/tree_puncher.png"
            }
        ];
        fs.writeFileSync(
            STATISTICS_CATEGORIES_PATH,
            JSON.stringify(starterCategories, null, 2),
            'utf-8'
        );
    }

    if (!fs.existsSync(STATISTICS_PLAYERS_PATH)) {
        fs.writeFileSync(
            STATISTICS_PLAYERS_PATH,
            JSON.stringify([], null, 2),
            'utf-8'
        );
    }
}

function loadStatisticsCategories() {
    try {
        if (!fs.existsSync(STATISTICS_CATEGORIES_PATH)) return [];
        const raw = JSON.parse(fs.readFileSync(STATISTICS_CATEGORIES_PATH, 'utf-8'));
        return Array.isArray(raw) ? raw : [];
    } catch (error) {
        console.error('Failed to load statistics categories:', error.message);
        return [];
    }
}

function loadStatisticsPlayers() {
    try {
        if (!fs.existsSync(STATISTICS_PLAYERS_PATH)) return [];
        const raw = JSON.parse(fs.readFileSync(STATISTICS_PLAYERS_PATH, 'utf-8'));
        return Array.isArray(raw) ? raw : [];
    } catch (error) {
        console.error('Failed to load statistics players:', error.message);
        return [];
    }
}

function saveStatisticsPlayers(players) {
    fs.writeFileSync(
        STATISTICS_PLAYERS_PATH,
        JSON.stringify(Array.isArray(players) ? players : [], null, 2),
        'utf-8'
    );
}

function getStatisticsData() {
    const rawCategories = loadStatisticsCategories();
    const rawPlayers = loadStatisticsPlayers();
    const categories = rawCategories
        .filter(category => category && typeof category.title === 'string' && typeof category.stat === 'string')
        .map((category, index) => ({
            slug: buildCategorySlug(category, index),
            title: category.title,
            stat: category.stat,
            description: category.description || '',
            icon_file: category.icon_file || ''
        }));

    const rankingsBySlug = {};
    for (const category of categories) {
        rankingsBySlug[category.slug] = buildLeaderboard(category.stat, rawPlayers);
    }

    return { categories, rankingsBySlug };
}

function buildCategorySlug(category, index) {
    const source = (category.slug || category.title || `category-${index + 1}`).toString();
    const slug = source
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return slug || `category-${index + 1}`;
}

function buildLeaderboard(statKey, players) {
    const leaderboard = [];

    for (const player of players) {
        const username = typeof player.username === 'string' ? player.username.trim() : '';
        if (!username) continue;

        const statsMap = parseStatsMap(player.stat_string);
        const rawValue = resolveStatValue(statsMap, statKey);
        if (rawValue === undefined || rawValue === null) continue;

        const value = Number(rawValue);
        if (!Number.isFinite(value)) continue;

        leaderboard.push({ username, value });
    }

    leaderboard.sort((a, b) => {
        if (b.value !== a.value) return b.value - a.value;
        return a.username.localeCompare(b.username);
    });

    return leaderboard;
}

function resolveStatValue(statsMap, statKey) {
    if (!statsMap || typeof statsMap !== 'object') return undefined;
    if (!statKey || typeof statKey !== 'string') return undefined;

    if (statsMap[statKey] !== undefined) return statsMap[statKey];

    const normalized = statKey.toLowerCase().trim();
    if (statsMap[normalized] !== undefined) return statsMap[normalized];

    const withoutPrefix = normalized.replace(/^minecraft:/, '');
    if (statsMap[withoutPrefix] !== undefined) return statsMap[withoutPrefix];

    return undefined;
}

function parseStatsMap(statString) {
    if (statString && typeof statString === 'object' && !Array.isArray(statString)) {
        return flattenStatObject(statString);
    }

    if (typeof statString !== 'string') return {};
    const trimmed = statString.trim();
    if (!trimmed) return {};

    try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            return flattenStatObject(parsed);
        }
    } catch (_) {}

    const extracted = {};
    const statRegex = /"?((?:minecraft:)?[a-z0-9_./-]+(?::[a-z0-9_./-]+)?)"?\s*[:=]\s*(-?\d+(?:\.\d+)?)/gi;
    let match = statRegex.exec(trimmed);
    while (match) {
        extracted[match[1]] = Number(match[2]);
        match = statRegex.exec(trimmed);
    }

    return extracted;
}

function flattenStatObject(obj, result = {}) {
    Object.entries(obj).forEach(([key, value]) => {
        if (typeof value === 'number') {
            result[key] = value;
            return;
        }
        if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) {
            result[key] = Number(value);
            return;
        }
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            if (isStatBucketKey(key)) {
                let bucketTotal = 0;
                Object.entries(value).forEach(([innerKey, innerValue]) => {
                    if (typeof innerValue !== 'number' && (typeof innerValue !== 'string' || Number.isNaN(Number(innerValue)))) {
                        return;
                    }

                    const numericValue = Number(innerValue);
                    bucketTotal += numericValue;
                    const canonicalInner = normalizeStatLeafKey(innerKey);
                    result[canonicalInner] = numericValue;

                    const bucketPrefixed = `minecraft:${key.replace(/^minecraft:/, '')}_${canonicalInner.replace(/^minecraft:/, '')}`;
                    result[bucketPrefixed] = numericValue;
                });
                result[`minecraft:${key.replace(/^minecraft:/, '')}`] = bucketTotal;
                return;
            }

            flattenStatObject(value, result);
        }
    });
    return result;
}

function isStatBucketKey(key) {
    const bucket = key.replace(/^minecraft:/, '');
    return ['mined', 'crafted', 'used', 'broken', 'picked_up', 'dropped', 'killed', 'killed_by', 'custom'].includes(bucket);
}

function normalizeStatLeafKey(key) {
    if (typeof key !== 'string') return String(key);
    return key.startsWith('minecraft:') ? key : `minecraft:${key}`;
}