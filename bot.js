const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const axios = require('axios');
const fs = require('fs');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    }
});

const PREFIX = '.';
const BOT_NAME = 'Ayanokoji';
const CREATOR = 'Kynx';

// Data storage
const userData = new Map();
const groupData = new Map();

// Card rarities
const CARD_RARITIES = {
    COMMON: { chance: 0.50, value: 100, emoji: '⚪' },
    UNCOMMON: { chance: 0.30, value: 300, emoji: '🟢' },
    RARE: { chance: 0.15, value: 800, emoji: '🔵' },
    EPIC: { chance: 0.04, value: 2000, emoji: '🟣' },
    LEGENDARY: { chance: 0.01, value: 5000, emoji: '🟡' }
};

const CARD_CHARACTERS = [
    'Gojo', 'Sukuna', 'Itadori', 'Megumi', 'Nobara', 'Maki',
    'Naruto', 'Sasuke', 'Kakashi', 'Sakura', 'Hinata', 'Gaara',
    'Luffy', 'Zoro', 'Nami', 'Sanji', 'Chopper', 'Robin',
    'Goku', 'Vegeta', 'Gohan', 'Piccolo', 'Krillin', 'Trunks',
    'Eren', 'Mikasa', 'Levi', 'Armin', 'Erwin', 'Hange',
    'Tanjiro', 'Nezuko', 'Zenitsu', 'Inosuke', 'Giyu', 'Rengoku',
    'Light', 'L', 'Ryuk', 'Misa', 'Near', 'Mello',
    'Edward', 'Alphonse', 'Roy', 'Riza', 'Winry', 'Scar'
];

// Load/Save data
function loadData() {
    try {
        if (fs.existsSync('userdata.json')) {
            const data = JSON.parse(fs.readFileSync('userdata.json'));
            Object.entries(data).forEach(([k, v]) => userData.set(k, v));
        }
        if (fs.existsSync('groupdata.json')) {
            const data = JSON.parse(fs.readFileSync('groupdata.json'));
            Object.entries(data).forEach(([k, v]) => groupData.set(k, v));
        }
    } catch (e) { console.log('No previous data'); }
}

function saveData() {
    fs.writeFileSync('userdata.json', JSON.stringify(Object.fromEntries(userData)));
    fs.writeFileSync('groupdata.json', JSON.stringify(Object.fromEntries(groupData)));
}

function getUser(userId) {
    if (!userData.has(userId)) {
        userData.set(userId, {
            name: 'Anonymous',
            bio: 'No bio set',
            age: 0,
            balance: 1000,
            bank: 0,
            inventory: {},
            cards: [],
            deck: [],
            lastDaily: 0,
            lastDig: 0,
            lastFish: 0,
            level: 1,
            xp: 0,
            wins: 0,
            losses: 0
        });
    }
    return userData.get(userId);
}

function getGroup(groupId) {
    if (!groupData.has(groupId)) {
        groupData.set(groupId, {
            antilink: false,
            antism: false,
            antilinkAction: 'kick',
            welcome: false,
            leave: false,
            welcomeMsg: 'Welcome @user!',
            leaveMsg: 'Goodbye @user!',
            nsfw: false,
            warnings: {},
            blacklist: [],
            muted: [],
            activity: {}
        });
    }
    return groupData.get(groupId);
}

function generateCard() {
    const rand = Math.random();
    let rarity = 'COMMON';
    let cumulative = 0;
    
    for (const [r, data] of Object.entries(CARD_RARITIES)) {
        cumulative += data.chance;
        if (rand <= cumulative) {
            rarity = r;
            break;
        }
    }
    
    const character = CARD_CHARACTERS[Math.floor(Math.random() * CARD_CHARACTERS.length)];
    return {
        id: Date.now() + Math.random(),
        character,
        rarity,
        value: CARD_RARITIES[rarity].value,
        emoji: CARD_RARITIES[rarity].emoji
    };
}

function getMenu() {
    return `╭━━ ✦彡  𝚴𝚵𝚾𝚯𝚪𝚫  彡✦ ━━╮     
║  ✧ Name: ${BOT_NAME}
║  ✧ Prefix  : ${PREFIX}   
║  ✧ Creator : ${CREATOR}
╰━━━━━━━━━━━━━━━━━━╯
 ❖ *.support* official group

╓─── ◈ BASIC ACCESS ◈ ───╖
║ ◇ .profile / p
║ ◇ .edit
║ ◇ .bio
║ ◇ .setage
║ ◇ .inventory / inv
╟── ◈ ECONOMY CORE ◈ ──╢
║ ◆ .bal
║ ◆ .daily
║ ◆ .wd
║ ◆ .dep
║ ◆ .donate
║ ◆ .lottery
║ ◆ .rich
║ ◆ .richg
║ ◆ .shop
║ ◆ .buy
║ ◆ .sell
║ ◆ .dig
║ ◆ .fish
║ ◆ .lb
║ ◆ .gamble
║ ◆ .beg
║ ◆ .roast
╟── ◈ CARD SYSTEM ◈ ──╢
║ ◈ .cards
║ ◈ .card
║ ◈ .ci / .cardinfo
║ ◈ .deck
║ ◈ .cardshop
║ ◈ .buypack
║ ◈ .sellc
║ ◈ .claim
╟── ◈ CASINO & RISK ◈ ──╢
║ ◇ .slots
║ ◇ .cf
║ ◇ .dice
║ ◇ .roulette
║ ◇ .horse
║ ◇ .db
║ ◇ .dp
╟── ◈ INTERACTION ◈ ──╢
║ ✦ .hug / .kiss / .slap
║ ✦ .wave / .pat / .bonk
║ ✦ .punch / .kill
║ ✦ .dance / .sad / .smile
╟── ◈ FUN & CHAOS ◈ ──╢
║ • .gay / .lesbian / .simp
║ • .ship / .skill / .pp
║ • .wyr / .joke
║ • .truth / .dare / .td
╟── ◈ MEDIA CONVERT ◈ ──╢
║ ◈ .sticker / s
║ ◈ .take / .toimg
╟── ◈ ANIME ZONE ◈ ──╢
║ 🌸 .waifu / .neko / .maid
║ 🔞 .nsfw on/off
║ 🔞 .hentai
╟── ◈ ADMIN CONTROL ◈ ──╢
║ ■ .kick / .promote / .demote
║ ■ .antilink / .antism
║ ■ .warn / .resetwarn
║ ■ .welcome / .leave
║ ■ .setwelcome / .setleave
║ ■ .mute / .unmute
║ ■ .hidetag / .tagall
║ ■ .open / .close
║ ■ .activity / .groupstats
╰━━━━━━━━━━━━━━━━━━╯`;
}

// COMMANDS
const commands = {
    menu: async (msg) => await msg.reply(getMenu()),
    
    profile: async (msg) => {
        const user = getUser(msg.from);
        await msg.reply(`╭─── ◈ PROFILE ◈ ───╮
║ 👤 ${user.name}
║ 📝 ${user.bio}
║ 🎂 Age: ${user.age || 'Not set'}
║ 💰 $${user.balance}
║ 🏦 $${user.bank}
║ ⭐ Lvl ${user.level} (${user.xp} XP)
║ 🎴 ${user.cards.length} cards
║ 🏆 ${user.wins}W / ${user.losses}L
╰━━━━━━━━━━━━━━━━━╯`);
    },
    
    p: async (msg) => commands.profile(msg),
    
    edit: async (msg, args) => {
        if (!args[0]) return msg.reply('Usage: .edit [name]');
        const user = getUser(msg.from);
        user.name = args.join(' ').slice(0, 30);
        saveData();
        await msg.reply(`✅ Name: ${user.name}`);
    },
    
    bio: async (msg, args) => {
        if (!args[0]) return msg.reply('Usage: .bio [text]');
        const user = getUser(msg.from);
        user.bio = args.join(' ').slice(0, 100);
        saveData();
        await msg.reply('✅ Bio updated!');
    },
    
    setage: async (msg, args) => {
        if (!args[0] || isNaN(args[0])) return msg.reply('Usage: .setage [age]');
        const user = getUser(msg.from);
        user.age = Math.max(13, Math.min(100, parseInt(args[0])));
        saveData();
        await msg.reply(`✅ Age: ${user.age}`);
    },
    
    inventory: async (msg) => {
        const user = getUser(msg.from);
        const items = Object.entries(user.inventory);
        if (items.length === 0) return msg.reply('📦 Empty!');
        
        let inv = '╭─── ◈ INVENTORY ◈ ───╮\n';
        items.forEach(([item, qty]) => {
            inv += `║ ${item}: ${qty}\n`;
        });
        inv += '╰━━━━━━━━━━━━━━━━━╯';
        await msg.reply(inv);
    },
    
    inv: async (msg) => commands.inventory(msg),
    
    bal: async (msg) => {
        const user = getUser(msg.from);
        await msg.reply(`💰 Wallet: $${user.balance}\n🏦 Bank: $${user.bank}\n💎 Net: $${user.balance + user.bank}`);
    },
    
    daily: async (msg) => {
        const user = getUser(msg.from);
        const now = Date.now();
        const cooldown = 86400000;
        
        if (now - user.lastDaily < cooldown) {
            const left = cooldown - (now - user.lastDaily);
            const h = Math.floor(left / 3600000);
            return msg.reply(`⏰ ${h}h left`);
        }
        
        const amt = 500 + Math.floor(Math.random() * 500);
        user.balance += amt;
        user.lastDaily = now;
        saveData();
        await msg.reply(`✅ +$${amt}`);
    },
    
    wd: async (msg, args) => {
        const user = getUser(msg.from);
        const amt = args[0] === 'all' ? user.bank : parseInt(args[0]);
        if (isNaN(amt) || amt < 1) return msg.reply('Usage: .wd [amount/all]');
        if (amt > user.bank) return msg.reply('❌ Insufficient!');
        
        user.bank -= amt;
        user.balance += amt;
        saveData();
        await msg.reply(`✅ Withdrew $${amt}`);
    },
    
    dep: async (msg, args) => {
        const user = getUser(msg.from);
        const amt = args[0] === 'all' ? user.balance : parseInt(args[0]);
        if (isNaN(amt) || amt < 1) return msg.reply('Usage: .dep [amount/all]');
        if (amt > user.balance) return msg.reply('❌ Insufficient!');
        
        user.balance -= amt;
        user.bank += amt;
        saveData();
        await msg.reply(`✅ Deposited $${amt}`);
    },
    
    donate: async (msg, args) => {
        const mentions = await msg.getMentions();
        if (!mentions[0] || !args[1]) return msg.reply('Usage: .donate @user [amt]');
        
        const user = getUser(msg.from);
        const target = getUser(mentions[0].id._serialized);
        const amt = parseInt(args[1]);
        
        if (isNaN(amt) || amt < 1) return msg.reply('❌ Invalid!');
        if (amt > user.balance) return msg.reply('❌ Broke!');
        
        user.balance -= amt;
        target.balance += amt;
        saveData();
        await msg.reply(`✅ Sent $${amt}`);
    },
    
    lottery: async (msg, args) => {
        const user = getUser(msg.from);
        const bet = parseInt(args[0]);
        if (isNaN(bet) || bet < 100) return msg.reply('Min: $100');
        if (bet > user.balance) return msg.reply('❌ Broke!');
        
        const win = Math.random() < 0.1;
        if (win) {
            const prize = bet * 10;
            user.balance += prize;
            await msg.reply(`🎉 WON $${prize}!`);
        } else {
            user.balance -= bet;
            await msg.reply(`😢 Lost $${bet}`);
        }
        saveData();
    },
    
    rich: async (msg) => {
        const sorted = Array.from(userData.entries())
            .sort((a, b) => (b[1].balance + b[1].bank) - (a[1].balance + a[1].bank))
            .slice(0, 10);
        
        let lb = '╭─── ◈ TOP 10 ◈ ───╮\n';
        sorted.forEach(([_, u], i) => {
            const medal = ['🥇','🥈','🥉'][i] || `${i+1}.`;
            lb += `║ ${medal} ${u.name}: $${u.balance + u.bank}\n`;
        });
        lb += '╰━━━━━━━━━━━━━━━━━╯';
        await msg.reply(lb);
    },
    
    richg: async (msg) => {
        const chat = await msg.getChat();
        if (!chat.isGroup) return msg.reply('❌ Groups only!');
        
        const members = [];
        for (const p of chat.participants) {
            const u = userData.get(p.id._serialized);
            if (u) members.push([p.id.user, u]);
        }
        
        members.sort((a, b) => (b[1].balance + b[1].bank) - (a[1].balance + a[1].bank));
        
        let lb = '╭─── ◈ GROUP TOP 10 ◈ ───╮\n';
        members.slice(0, 10).forEach(([num, u], i) => {
            lb += `║ ${i+1}. ${u.name}: $${u.balance + u.bank}\n`;
        });
        lb += '╰━━━━━━━━━━━━━━━━━╯';
        await msg.reply(lb);
    },
    
    shop: async (msg) => {
        await msg.reply(`╭─── ◈ SHOP ◈ ───╮
║ 🎣 Rod: $500
║ ⛏️ Pickaxe: $500
║ 🎰 Ticket: $100
║ 💎 Diamond: $5000
║ 🗡️ Sword: $1000
║ 🛡️ Shield: $1000
╰━━━━━━━━━━━━━━━━━╯
.buy [item]`);
    },
    
    buy: async (msg, args) => {
        const user = getUser(msg.from);
        const items = {
            'rod': { name: '🎣 Rod', price: 500 },
            'pickaxe': { name: '⛏️ Pickaxe', price: 500 },
            'ticket': { name: '🎰 Ticket', price: 100 },
            'diamond': { name: '💎 Diamond', price: 5000 },
            'sword': { name: '🗡️ Sword', price: 1000 },
            'shield': { name: '🛡️ Shield', price: 1000 }
        };
        
        const item = items[args[0]?.toLowerCase()];
        if (!item) return msg.reply('❌ Invalid item!');
        if (user.balance < item.price) return msg.reply('❌ Broke!');
        
        user.balance -= item.price;
        user.inventory[item.name] = (user.inventory[item.name] || 0) + 1;
        saveData();
        await msg.reply(`✅ Bought ${item.name}!`);
    },
    
    sell: async (msg, args) => {
        const user = getUser(msg.from);
        if (!args[0]) return msg.reply('Usage: .sell [item]');
        
        const itemName = args.join(' ');
        const qty = user.inventory[itemName];
        if (!qty) return msg.reply('❌ You don\'t have that!');
        
        const value = Math.floor(Math.random() * 200) + 50;
        user.inventory[itemName]--;
        if (user.inventory[itemName] === 0) delete user.inventory[itemName];
        user.balance += value;
        saveData();
        await msg.reply(`✅ Sold for $${value}!`);
    },
    
    dig: async (msg) => {
        const user = getUser(msg.from);
        if (!user.inventory['⛏️ Pickaxe']) return msg.reply('❌ Need pickaxe!');
        
        const now = Date.now();
        if (now - user.lastDig < 60000) return msg.reply('⏰ 1min cooldown');
        
        const items = [
            { name: '💎 Diamond', value: 1000 },
            { name: '💰 Gold', value: 500 },
            { name: '🪨 Stone', value: 50 },
            { name: '⚱️ Nothing', value: 0 }
        ];
        const found = items[Math.floor(Math.random() * items.length)];
        
        user.lastDig = now;
        if (found.value > 0) {
            user.balance += found.value;
            user.inventory[found.name] = (user.inventory[found.name] || 0) + 1;
            saveData();
            await msg.reply(`⛏️ Found ${found.name}! +$${found.value}`);
        } else {
            await msg.reply('⛏️ Found nothing!');
        }
    },
    
    fish: async (msg) => {
        const user = getUser(msg.from);
        if (!user.inventory['🎣 Rod']) return msg.reply('❌ Need rod!');
        
        const now = Date.now();
        if (now - user.lastFish < 60000) return msg.reply('⏰ 1min cooldown');
        
        const items = [
            { name: '🐟 Fish', value: 300 },
            { name: '🦈 Shark', value: 1500 },
            { name: '🐙 Octopus', value: 800 },
            { name: '🗑️ Trash', value: 0 }
        ];
        const caught = items[Math.floor(Math.random() * items.length)];
        
        user.lastFish = now;
        if (caught.value > 0) {
            user.balance += caught.value;
            user.inventory[caught.name] = (user.inventory[caught.name] || 0) + 1;
            saveData();
            await msg.reply(`🎣 Caught ${caught.name}! +$${caught.value}`);
        } else {
            await msg.reply('🎣 Trash! 🗑️');
        }
    },
    
    lb: async (msg) => {
        const sorted = Array.from(userData.entries())
            .sort((a, b) => b[1].level - a[1].level)
            .slice(0, 10);
        
        let lb = '╭─── ◈ LEADERBOARD ◈ ───╮\n';
        sorted.forEach(([_, u], i) => {
            const medal = ['🥇','🥈','🥉'][i] || `${i+1}.`;
            lb += `║ ${medal} ${u.name} - Lvl ${u.level}\n`;
        });
        lb += '╰━━━━━━━━━━━━━━━━━╯';
        await msg.reply(lb);
    },
    
    gamble: async (msg, args) => {
        const user = getUser(msg.from);
        const bet = parseInt(args[0]);
        if (isNaN(bet) || bet < 10) return msg.reply('Min: $10');
        if (bet > user.balance) return msg.reply('❌ Broke!');
        
        const mult = Math.random() < 0.5 ? 2 : -1;
        user.balance += bet * mult;
        saveData();
        await msg.reply(mult > 0 ? `🎲 Won $${bet}!` : `😢 Lost $${bet}!`);
    },
    
    beg: async (msg) => {
        const user = getUser(msg.from);
        const amt = Math.floor(Math.random() * 100) + 10;
        user.balance += amt;
        saveData();
        await msg.reply(`🥺 +$${amt}`);
    },
    
    roast: async (msg) => {
        const mentions = await msg.getMentions();
        const target = mentions[0] ? `@${mentions[0].number}` : 'You';
        const roasts = [
            `${target}, even GPT-1 is smarter!`,
            `${target} brings joy... when leaving!`,
            `${target}'s IQ = room temperature!`,
            `If ${target} was any slower, they'd go backwards!`,
            `${target} = human error personified!`
        ];
        await msg.reply(`🔥 ${roasts[Math.floor(Math.random() * roasts.length)]}`);
    },
    
    cards: async (msg) => {
        const user = getUser(msg.from);
        if (!user.cards.length) return msg.reply('📇 No cards! .cardshop');
        
        let list = '╭─── ◈ YOUR CARDS ◈ ───╮\n';
        user.cards.slice(0, 15).forEach((c, i) => {
            list += `║ ${i+1}. ${c.emoji} ${c.character} (${c.rarity})\n`;
        });
        list += `╰━━━━━━━━━━━━━━━━━╯\nTotal: ${user.cards.length}`;
        await msg.reply(list);
    },
    
    card: async (msg, args) => {
        const user = getUser(msg.from);
        const idx = parseInt(args[0]) - 1;
        if (isNaN(idx) || !user.cards[idx]) return msg.reply('❌ Invalid!');
        
        const c = user.cards[idx];
        await msg.reply(`${c.emoji} ${c.character}
Rarity: ${c.rarity}
Value: $${c.value}
ID: ${c.id.toString().slice(-8)}`);
    },
    
    ci: async (msg, args) => commands.card(msg, args),
    cardinfo: async (msg, args) => commands.card(msg, args),
    
    deck: async (msg) => {
        const user = getUser(msg.from);
        if (!user.deck.length) return msg.reply('🎴 Empty deck!');
        
        let list = '╭─── ◈ DECK ◈ ───╮\n';
        user.deck.forEach((c, i) => {
            list += `║ ${i+1}. ${c.emoji} ${c.character}\n`;
        });
        list += '╰━━━━━━━━━━━━━━━━━╯';
        await msg.reply(list);
    },
    
    cardshop: async (msg) => {
        await msg.reply(`╭─── ◈ CARD SHOP ◈ ───╮
║ 📦 Basic: $500 (3 cards)
║ 💎 Premium: $2000 (5 cards)
║ 🌟 Legendary: $5000 (10 cards)
╰━━━━━━━━━━━━━━━━━╯
.buypack [basic/premium/legendary]`);
    },
    
    buypack: async (msg, args) => {
        const user = getUser(msg.from);
        const packs = {
            basic: { price: 500, count: 3 },
            premium: { price: 2000, count: 5 },
            legendary: { price: 5000, count: 10 }
        };
        
        const pack = packs[args[0]?.toLowerCase()];
        if (!pack) return msg.reply('❌ Invalid pack!');
        if (user.balance < pack.price) return msg.reply('❌ Broke!');
        
        user.balance -= pack.price;
        const newCards = [];
        for (let i = 0; i < pack.count; i++) {
            const card = generateCard();
            user.cards.push(card);
            newCards.push(`${card.emoji} ${card.character}`);
        }
        saveData();
        
        await msg.reply(`✅ Opened!\n${newCards.join('\n')}`);
    },
    
    sellc: async (msg, args) => {
        const user = getUser(msg.from);
        const idx = parseInt(args[0]) - 1;
        if (isNaN(idx) || !user.cards[idx]) return msg.reply('❌ Invalid!');
        
        const card = user.cards[idx];
        user.balance += card.value;
        user.cards.splice(idx, 1);
        saveData();
        await msg.reply(`✅ Sold ${card.character} for $${card.value}!`);
    },
    
    claim: async (msg) => {
        const user = getUser(msg.from);
        const card = generateCard();
        user.cards.push(card);
        saveData();
        await msg.reply(`🎴 Claimed: ${card.emoji} ${card.character} (${card.rarity})!`);
    },
    
    slots: async (msg, args) => {
        const user = getUser(msg.from);
        const bet = parseInt(args[0]);
        if (isNaN(bet) || bet < 10) return msg.reply('Min: $10');
        if (bet > user.balance) return msg.reply('❌ Broke!');
        
        const symbols = ['🍒', '🍋', '🍊', '💎', '7️⃣'];
        const s = [symbols[Math.floor(Math.random() * symbols.length)],
                   symbols[Math.floor(Math.random() * symbols.length)],
                   symbols[Math.floor(Math.random() * symbols.length)]];
        
        let result = `🎰 [ ${s[0]} | ${s[1]} | ${s[2]} ]\n\n`;
        
        if (s[0] === s[1] && s[1] === s[2]) {
            const prize = s[0] === '💎' ? bet * 10 : bet * 5;
            user.balance += prize;
            result += `🎉 JACKPOT! +$${prize}`;
        } else if (s[0] === s[1] || s[1] === s[2]) {
            user.balance += bet;
            result += `✨ +$${bet}`;
        } else {
            user.balance += bet;
            result += `✨ +$${bet}`;
        } else {
            user.balance -= bet;
            result += `😢 -$${bet}`;
        }
        saveData();
        await msg.reply(result);
    },
    
    cf: async (msg, args) => {
        const user = getUser(msg.from);
        const choice = args[0]?.toLowerCase();
        const bet = parseInt(args[1]);
        if (!['heads', 'tails'].includes(choice) || isNaN(bet)) {
            return msg.reply('Usage: .cf [heads/tails] [amount]');
        }
        if (bet > user.balance) return msg.reply('❌ Broke!');
        
        const result = Math.random() < 0.5 ? 'heads' : 'tails';
        if (result === choice) {
            user.balance += bet;
            await msg.reply(`🪙 ${result.toUpperCase()}! Won $${bet}!`);
        } else {
            user.balance -= bet;
            await msg.reply(`🪙 ${result.toUpperCase()}! Lost $${bet}!`);
        }
        saveData();
    },
    
    dice: async (msg, args) => {
        const user = getUser(msg.from);
        const bet = parseInt(args[0]);
        if (isNaN(bet) || bet < 10) return msg.reply('Min: $10');
        if (bet > user.balance) return msg.reply('❌ Broke!');
        
        const r1 = Math.floor(Math.random() * 6) + 1;
        const r2 = Math.floor(Math.random() * 6) + 1;
        const total = r1 + r2;
        
        let result = `🎲 ${r1} + ${r2} = ${total}\n`;
        if (total >= 10) {
            user.balance += bet * 2;
            result += `🎉 Won $${bet * 2}!`;
        } else {
            user.balance -= bet;
            result += `😢 Lost $${bet}!`;
        }
        saveData();
        await msg.reply(result);
    },
    
    roulette: async (msg, args) => {
        const user = getUser(msg.from);
        const choice = args[0]?.toLowerCase();
        const bet = parseInt(args[1]);
        if (!['red', 'black', 'green'].includes(choice) || isNaN(bet)) {
            return msg.reply('Usage: .roulette [red/black/green] [amt]');
        }
        if (bet > user.balance) return msg.reply('❌ Broke!');
        
        const colors = ['red', 'black', 'green'];
        const result = colors[Math.floor(Math.random() * colors.length)];
        
        if (result === choice) {
            const mult = result === 'green' ? 10 : 2;
            user.balance += bet * mult;
            await msg.reply(`🎡 ${result.toUpperCase()}! Won $${bet * mult}!`);
        } else {
            user.balance -= bet;
            await msg.reply(`🎡 ${result.toUpperCase()}! Lost $${bet}!`);
        }
        saveData();
    },
    
    horse: async (msg, args) => {
        const user = getUser(msg.from);
        const horse = parseInt(args[0]);
        const bet = parseInt(args[1]);
        if (isNaN(horse) || horse < 1 || horse > 5 || isNaN(bet)) {
            return msg.reply('Usage: .horse [1-5] [amount]');
        }
        if (bet > user.balance) return msg.reply('❌ Broke!');
        
        const horses = ['🐴', '🐎', '🦄', '🏇', '🐴'];
        const winner = Math.floor(Math.random() * 5) + 1;
        
        let race = '🏁 HORSE RACE 🏁\n\n';
        for (let i = 1; i <= 5; i++) {
            race += `${i}. ${horses[i-1]} ${i === winner ? '👑' : ''}\n`;
        }
        
        if (horse === winner) {
            user.balance += bet * 4;
            race += `\n🎉 You won $${bet * 4}!`;
        } else {
            user.balance -= bet;
            race += `\n😢 Lost $${bet}!`;
        }
        saveData();
        await msg.reply(race);
    },
    
    db: async (msg, args) => {
        const user = getUser(msg.from);
        const bet = parseInt(args[0]);
        if (isNaN(bet) || bet < 100) return msg.reply('Min: $100');
        if (bet > user.balance) return msg.reply('❌ Broke!');
        
        const mult = Math.random() < 0.5 ? 2 : 0;
        if (mult > 0) {
            user.balance += bet;
            await msg.reply(`🎲 DOUBLE! Won $${bet}!`);
        } else {
            user.balance -= bet;
            await msg.reply(`💥 BUST! Lost $${bet}!`);
        }
        saveData();
    },
    
    dp: async (msg, args) => {
        const user = getUser(msg.from);
        const bet = parseInt(args[0]);
        if (isNaN(bet) || bet < 50) return msg.reply('Min: $50');
        if (bet > user.balance) return msg.reply('❌ Broke!');
        
        const chance = Math.random();
        let result = '';
        
        if (chance < 0.33) {
            user.balance += bet * 2;
            result = `🎉 DOUBLE! +$${bet * 2}!`;
        } else if (chance < 0.66) {
            result = `😐 PUSH! No change!`;
        } else {
            user.balance -= bet;
            result = `😢 Lost $${bet}!`;
        }
        saveData();
        await msg.reply(result);
    },
    
    hug: async (msg) => {
        const mentions = await msg.getMentions();
        if (!mentions[0]) return msg.reply('❌ Tag someone!');
        await msg.reply(`🤗 Hugged @${mentions[0].number}!`);
    },
    
    kiss: async (msg) => {
        const mentions = await msg.getMentions();
        if (!mentions[0]) return msg.reply('❌ Tag someone!');
        await msg.reply(`😘 Kissed @${mentions[0].number}!`);
    },
    
    slap: async (msg) => {
        const mentions = await msg.getMentions();
        if (!mentions[0]) return msg.reply('❌ Tag someone!');
        await msg.reply(`👋 Slapped @${mentions[0].number}!`);
    },
    
    wave: async (msg) => {
        const mentions = await msg.getMentions();
        if (!mentions[0]) return msg.reply('❌ Tag someone!');
        await msg.reply(`👋 Waved at @${mentions[0].number}!`);
    },
    
    pat: async (msg) => {
        const mentions = await msg.getMentions();
        if (!mentions[0]) return msg.reply('❌ Tag someone!');
        await msg.reply(`🤲 Patted @${mentions[0].number}!`);
    },
    
    dance: async (msg) => await msg.reply('💃 Dancing!'),
    sad: async (msg) => await msg.reply('😢 *sad*'),
    smile: async (msg) => await msg.reply('😊 *smiles*'),
    laugh: async (msg) => await msg.reply('😂 HAHAHAHA!'),
    
    lick: async (msg) => {
        const mentions = await msg.getMentions();
        if (!mentions[0]) return msg.reply('❌ Tag someone!');
        await msg.reply(`👅 Licked @${mentions[0].number}!`);
    },
    
    punch: async (msg) => {
        const mentions = await msg.getMentions();
        if (!mentions[0]) return msg.reply('❌ Tag someone!');
        await msg.reply(`👊 Punched @${mentions[0].number}!`);
    },
    
    kill: async (msg) => {
        const mentions = await msg.getMentions();
        if (!mentions[0]) return msg.reply('❌ Tag someone!');
        await msg.reply(`💀 Killed @${mentions[0].number}!`);
    },
    
    bonk: async (msg) => {
        const mentions = await msg.getMentions();
        if (!mentions[0]) return msg.reply('❌ Tag someone!');
        await msg.reply(`🔨 BONK! @${mentions[0].number} go to horny jail!`);
    },
    
    tickle: async (msg) => {
        const mentions = await msg.getMentions();
        if (!mentions[0]) return msg.reply('❌ Tag someone!');
        await msg.reply(`🤭 Tickled @${mentions[0].number}!`);
    },
    
    shrug: async (msg) => await msg.reply('🤷 ¯\\_(ツ)_/¯'),
    wank: async (msg) => await msg.reply('🔞 Ayo?!'),
    
    kidnap: async (msg) => {
        const mentions = await msg.getMentions();
        if (!mentions[0]) return msg.reply('❌ Tag someone!');
        await msg.reply(`🚗💨 Kidnapped @${mentions[0].number}!`);
    },
    
    gay: async (msg) => {
        const mentions = await msg.getMentions();
        const target = mentions[0] ? `@${mentions[0].number}` : 'You';
        const pct = Math.floor(Math.random() * 101);
        await msg.reply(`🏳️‍🌈 ${target} is ${pct}% gay!`);
    },
    
    lesbian: async (msg) => {
        const mentions = await msg.getMentions();
        const target = mentions[0] ? `@${mentions[0].number}` : 'You';
        const pct = Math.floor(Math.random() * 101);
        await msg.reply(`💗 ${target} is ${pct}% lesbian!`);
    },
    
    simp: async (msg) => {
        const mentions = await msg.getMentions();
        const target = mentions[0] ? `@${mentions[0].number}` : 'You';
        const pct = Math.floor(Math.random() * 101);
        const rating = pct > 80 ? 'MEGA SIMP' : pct > 50 ? 'Simp' : 'Not Simp';
        await msg.reply(`😍 ${target} is ${pct}% simp\n${rating}!`);
    },
    
    ship: async (msg) => {
        const mentions = await msg.getMentions();
        if (mentions.length < 2) return msg.reply('❌ Tag 2 people!');
        
        const pct = Math.floor(Math.random() * 101);
        const hearts = pct > 80 ? '💕💕💕' : pct > 50 ? '💕💕' : '💕';
        await msg.reply(`💘 @${mentions[0].number} × @${mentions[1].number}\n\n${hearts} ${pct}%!`);
    },
    
    skill: async (msg, args) => {
        if (!args[0]) return msg.reply('Usage: .skill [skill]');
        const mentions = await msg.getMentions();
        const target = mentions[0] ? `@${mentions[0].number}` : 'You';
        const skill = args.join(' ');
        const pct = Math.floor(Math.random() * 101);
        await msg.reply(`🎯 ${target}'s ${skill}: ${pct}%`);
    },
    
    duality: async (msg) => {
        const traits = ['Kind/Cruel', 'Smart/Dumb', 'Brave/Coward', 'Leader/Follower', 'Angel/Devil'];
        const trait = traits[Math.floor(Math.random() * traits.length)];
        const pct = Math.floor(Math.random() * 101);
        await msg.reply(`⚖️ ${trait}: ${pct}% / ${100-pct}%`);
    },
    
    gen: async (msg) => {
        const gens = ['Gen Z', 'Millennial', 'Gen X', 'Boomer', 'Gen Alpha'];
        const gen = gens[Math.floor(Math.random() * gens.length)];
        await msg.reply(`👤 You're ${gen}!`);
    },
    
    pov: async (msg, args) => {
        if (!args[0]) return msg.reply('Usage: .pov [situation]');
        await msg.reply(`📱 POV: ${args.join(' ')}`);
    },
    
    social: async (msg) => {
        const pct = Math.floor(Math.random() * 101);
        const rating = pct > 80 ? 'Social Butterfly' : pct > 50 ? 'Normal' : 'Introvert';
        await msg.reply(`👥 Social Credit: ${pct}%\n${rating}!`);
    },
    
    relation: async (msg) => {
        const mentions = await msg.getMentions();
        if (mentions.length < 2) return msg.reply('❌ Tag 2 people!');
        
        const relations = ['Friends', 'Enemies', 'Lovers', 'Siblings', 'Strangers', 'Rivals', 'Besties'];
        const rel = relations[Math.floor(Math.random() * relations.length)];
        await msg.reply(`🔗 @${mentions[0].number} & @${mentions[1].number}: ${rel}!`);
    },
    
    pp: async (msg) => {
        const mentions = await msg.getMentions();
        const target = mentions[0] ? `@${mentions[0].number}` : 'You';
        const size = Math.floor(Math.random() * 20);
        const pp = '8' + '='.repeat(size) + 'D';
        await msg.reply(`🍆 ${target}'s pp:\n${pp}\n${size}cm`);
    },
    
    wyr: async (msg) => {
        const questions = [
            'be able to fly or be invisible?',
            'be rich or famous?',
            'live forever or die tomorrow?',
            'never use social media or never watch TV?',
            'be stuck alone or with someone you hate?'
        ];
        const q = questions[Math.floor(Math.random() * questions.length)];
        await msg.reply(`🤔 Would you rather ${q}`);
    },
    
    wouldyourather: async (msg) => commands.wyr(msg),
    
    joke: async (msg) => {
        try {
            const res = await axios.get('https://official-joke-api.appspot.com/random_joke');
            await msg.reply(`😄 ${res.data.setup}\n\n${res.data.punchline}`);
        } catch {
            await msg.reply('😅 Joke service down!');
        }
    },
    
    truth: async (msg) => {
        const truths = [
            'What\'s your biggest fear?',
            'Ever cheated in a game?',
            'Most embarrassing moment?',
            'First crush?',
            'Biggest secret?'
        ];
        await msg.reply(`🤔 ${truths[Math.floor(Math.random() * truths.length)]}`);
    },
    
    dare: async (msg) => {
        const dares = [
            'Send a voice message singing',
            'Change your pfp to something embarrassing',
            'Text "I love you" to someone random',
            'Do 20 pushups',
            'Post an embarrassing selfie'
        ];
        await msg.reply(`😈 ${dares[Math.floor(Math.random() * dares.length)]}`);
    },
    
    td: async (msg) => {
        const choice = Math.random() < 0.5 ? 'Truth' : 'Dare';
        if (choice === 'Truth') {
            await commands.truth(msg);
        } else {
            await commands.dare(msg);
        }
    },
    
    uno: async (msg) => await msg.reply('🎴 UNO game coming soon!'),
    
    sticker: async (msg) => {
        if (msg.hasMedia || msg.hasQuotedMsg) {
            const media = msg.hasMedia ? await msg.downloadMedia() : 
                          await (await msg.getQuotedMessage()).downloadMedia();
            
            if (media && media.mimetype.startsWith('image/')) {
                await client.sendMessage(msg.from, media, {
                    sendMediaAsSticker: true,
                    stickerAuthor: CREATOR,
                    stickerName: BOT_NAME
                });
            } else {
                await msg.reply('❌ Send an image!');
            }
        } else {
            await msg.reply('📸 Reply to an image with .sticker');
        }
    },
    
    s: async (msg) => commands.sticker(msg),
    
    take: async (msg, args) => {
        if (!args[0]) return msg.reply('Usage: .take [name]');
        if (msg.hasQuotedMsg) {
            const quoted = await msg.getQuotedMessage();
            if (quoted.hasMedia && quoted.type === 'sticker') {
                const media = await quoted.downloadMedia();
                await client.sendMessage(msg.from, media, {
                    sendMediaAsSticker: true,
                    stickerAuthor: CREATOR,
                    stickerName: args.join(' ')
                });
            }
        }
    },
    
    toimg: async (msg) => {
        if (msg.hasQuotedMsg) {
            const quoted = await msg.getQuotedMessage();
            if (quoted.type === 'sticker') {
                const media = await quoted.downloadMedia();
                await msg.reply(media);
            }
        } else {
            await msg.reply('❌ Reply to a sticker!');
        }
    },
    
    tovid: async (msg) => await msg.reply('🎥 Coming soon!'),
    rotate: async (msg) => await msg.reply('🔄 Coming soon!'),
    
    waifu: async (msg) => {
        try {
            const res = await axios.get('https://api.waifu.pics/sfw/waifu');
            const media = await MessageMedia.fromUrl(res.data.url);
            await msg.reply(media);
        } catch {
            await msg.reply('❌ Failed!');
        }
    },
    
    neko: async (msg) => {
        try {
            const res = await axios.get('https://api.waifu.pics/sfw/neko');
            const media = await MessageMedia.fromUrl(res.data.url);
            await msg.reply(media);
        } catch {
            await msg.reply('❌ Failed!');
        }
    },
    
    maid: async (msg) => {
        try {
            const res = await axios.get('https://api.waifu.pics/sfw/maid');
            const media = await MessageMedia.fromUrl(res.data.url);
            await msg.reply(media);
        } catch {
            await msg.reply('❌ Failed!');
        }
    },
    
    nsfw: async (msg, args) => {
        const chat = await msg.getChat();
        if (!chat.isGroup) return msg.reply('❌ Groups only!');
        
        const group = getGroup(chat.id._serialized);
        if (args[0] === 'on') {
            group.nsfw = true;
            await msg.reply('🔞 NSFW enabled!');
        } else if (args[0] === 'off') {
            group.nsfw = false;
            await msg.reply('✅ NSFW disabled!');
        } else {
            await msg.reply(`NSFW: ${group.nsfw ? 'ON' : 'OFF'}`);
        }
        saveData();
    },
    
    hentai: async (msg) => {
        const chat = await msg.getChat();
        const group = chat.isGroup ? getGroup(chat.id._serialized) : { nsfw: false };
        
        if (chat.isGroup && !group.nsfw) {
            return msg.reply('🔞 Enable with .nsfw on');
        }
        
        try {
            const res = await axios.get('https://api.waifu.pics/nsfw/waifu');
            const media = await MessageMedia.fromUrl(res.data.url);
            await msg.reply(media);
        } catch {
            await msg.reply('❌ Failed!');
        }
    },
    
    gpt: async (msg, args) => {
        if (!args[0]) return msg.reply('Usage: .gpt [prompt]');
        await msg.reply('🤖 GPT: Requires API key!');
    },
    
    copilot: async (msg, args) => {
        if (!args[0]) return msg.reply('Usage: .copilot [prompt]');
        await msg.reply('🤖 Copilot: Requires API!');
    },
    
    perplexity: async (msg, args) => {
        if (!args[0]) return msg.reply('Usage: .perplexity [query]');
        await msg.reply('🔍 Requires API!');
    },
    
    imagine: async (msg, args) => {
        if (!args[0]) return msg.reply('Usage: .imagine [prompt]');
        await msg.reply('🎨 Requires API!');
    },
    
    upscale: async (msg) => await msg.reply('📐 Requires API!'),
    
    translate: async (msg, args) => {
        if (!args[0] || !args[1]) return msg.reply('Usage: .translate [lang] [text]');
        await msg.reply('🌐 Requires API!');
    },
    
    tt: async (msg, args) => commands.translate(msg, args),
    transcribe: async (msg) => await msg.reply('🎤 Requires API!'),
    tb: async (msg) => commands.transcribe(msg),
    
    ig: async (msg, args) => {
        if (!args[0]) return msg.reply('Usage: .ig [url]');
        await msg.reply('📥 Instagram: Requires API!');
    },
    
    ttk: async (msg, args) => {
        if (!args[0]) return msg.reply('Usage: .ttk [url]');
        await msg.reply('📥 TikTok: Requires API!');
    },
    
    yt: async (msg, args) => {
        if (!args[0]) return msg.reply('Usage: .yt [url]');
        await msg.reply('📥 YouTube: Requires yt-dlp!');
    },
    
    x: async (msg, args) => {
        if (!args[0]) return msg.reply('Usage: .x [url]');
        await msg.reply('📥 X/Twitter: Requires API!');
    },
    
    fb: async (msg, args) => {
        if (!args[0]) return msg.reply('Usage: .fb [url]');
        await msg.reply('📥 Facebook: Requires API!');
    },
    
    play: async (msg, args) => {
        if (!args[0]) return msg.reply('Usage: .play [song]');
        await msg.reply(`🎵 Searching: ${args.join(' ')}\nRequires YT!`);
    },
    
    pinterest: async (msg, args) => {
        if (!args[0]) return msg.reply('Usage: .pinterest [query]');
        await msg.reply('📌 Requires API!');
    },
    
    pint: async (msg, args) => commands.pinterest(msg, args),
    sauce: async (msg) => await msg.reply('🔍 Requires API!'),
    reverseimg: async (msg) => commands.sauce(msg),
    
    wallpaper: async (msg, args) => {
        if (!args[0]) return msg.reply('Usage: .wallpaper [query]');
        await msg.reply('🖼️ Requires API!');
    },
    
    lyrics: async (msg, args) => {
        if (!args[0]) return msg.reply('Usage: .lyrics [song]');
        await msg.reply('🎵 Requires API!');
    },
    
    kick: async (msg) => {
        const chat = await msg.getChat();
        if (!chat.isGroup) return msg.reply('❌ Groups only!');
        
        const mentions = await msg.getMentions();
        if (!mentions[0]) return msg.reply('❌ Tag someone!');
        
        try {
            await chat.removeParticipants([mentions[0].id._serialized]);
            await msg.reply('✅ Kicked!');
        } catch {
            await msg.reply('❌ Failed! Need admin.');
        }
    },
    
    delete: async (msg) => {
        if (msg.hasQuotedMsg) {
            const quoted = await msg.getQuotedMessage();
            try {
                await quoted.delete(true);
            } catch {
                await msg.reply('❌ Can\'t delete!');
            }
        }
    },
    
    antilink: async (msg, args) => {
        const chat = await msg.getChat();
        if (!chat.isGroup) return msg.reply('❌ Groups only!');
        
        const group = getGroup(chat.id._serialized);
        if (args[0] === 'on') {
            group.antilink = true;
            await msg.reply('✅ Antilink ON!');
        } else if (args[0] === 'off') {
            group.antilink = false;
            await msg.reply('✅ Antilink OFF!');
        } else if (args[0] === 'action') {
            if (args[1]) {
                group.antilinkAction = args[1];
                await msg.reply(`✅ Action: ${args[1]}`);
            } else {
                await msg.reply(`Current: ${group.antilinkAction}`);
            }
        } else {
            await msg.reply(`Antilink: ${group.antilink ? 'ON' : 'OFF'}`);
        }
        saveData();
    },
    
    antism: async (msg, args) => {
        const chat = await msg.getChat();
        if (!chat.isGroup) return msg.reply('❌ Groups only!');
        
        const group = getGroup(chat.id._serialized);
        if (args[0] === 'on') {
            group.antism = true;
            await msg.reply('✅ Anti-spam ON!');
        } else if (args[0] === 'off') {
            group.antism = false;
            await msg.reply('✅ Anti-spam OFF!');
        } else {
            await msg.reply(`Anti-spam: ${group.antism ? 'ON' : 'OFF'}`);
        }
        saveData();
    },
    
    warn: async (msg, args) => {
        const chat = await msg.getChat();
        if (!chat.isGroup) return msg.reply('❌ Groups only!');
        
        const mentions = await msg.getMentions();
        if (!mentions[0]) return msg.reply('❌ Tag someone!');
        
        const group = getGroup(chat.id._serialized);
        const userId = mentions[0].id._serialized;
        
        if (!group.warnings[userId]) group.warnings[userId] = 0;
        group.warnings[userId]++;
        
        const warns = group.warnings[userId];
        saveData();
        
        if (warns >= 3) {
            try {
                await chat.removeParticipants([userId]);
                await msg.reply(`⚠️ @${mentions[0].number} kicked! (3 warns)`);
                group.warnings[userId] = 0;
            } catch {
                await msg.reply('❌ Can\'t kick!');
            }
        } else {
            await msg.reply(`⚠️ Warning ${warns}/3 for @${mentions[0].number}`);
        }
    },
    
    resetwarn: async (msg) => {
        const chat = await msg.getChat();
        if (!chat.isGroup) return msg.reply('❌ Groups only!');
        
        const mentions = await msg.getMentions();
        if (!mentions[0]) return msg.reply('❌ Tag someone!');
        
        const group = getGroup(chat.id._serialized);
        group.warnings[mentions[0].id._serialized] = 0;
        saveData();
        await msg.reply(`✅ Warnings reset!`);
    },
    
    groupstats: async (msg) => {
        const chat = await msg.getChat();
        if (!chat.isGroup) return msg.reply('❌ Groups only!');
        
        const admins = chat.participants.filter(p => p.isAdmin).length;
        await msg.reply(`╭─── ◈ GROUP STATS ◈ ───╮
║ 📛 ${chat.name}
║ 👥 ${chat.participants.length} members
║ 👑 ${admins} admins
║ 📅 Created: ${new Date(chat.createdAt * 1000).toLocaleDateString()}
╰━━━━━━━━━━━━━━━━━╯`);
    },
    
    gs: async (msg) => commands.groupstats(msg),
    
    welcome: async (msg, args) => {
        const chat = await msg.getChat();
        if (!chat.isGroup) return msg.reply('❌ Groups only!');
        
        const group = getGroup(chat.id._serialized);
        if (args[0] === 'on') {
            group.welcome = true;
            await msg.reply('✅ Welcome ON!');
        } else if (args[0] === 'off') {
            group.welcome = false;
            await msg.reply('✅ Welcome OFF!');
        }
        saveData();
    },
    
    setwelcome: async (msg, args) => {
        const chat = await msg.getChat();
        if (!chat.isGroup) return msg.reply('❌ Groups only!');
        if (!args[0]) return msg.reply('Usage: .setwelcome [message] (use @user)');
        
        const group = getGroup(chat.id._serialized);
        group.welcomeMsg = args.join(' ');
        saveData();
        await msg.reply('✅ Welcome message set!');
    },
    
    leave: async (msg, args) => {
        const chat = await msg.getChat();
        if (!chat.isGroup) return msg.reply('❌ Groups only!');
        
        const group = getGroup(chat.id._serialized);
        if (args[0] === 'on') {
            group.leave = true;
            await msg.reply('✅ Leave messages ON!');
        } else if (args[0] === 'off') {
            group.leave = false;
            await msg.reply('✅ Leave messages OFF!');
                  }
        saveData();
    },
    
    setleave: async (msg, args) => {
        const chat = await msg.getChat();
        if (!chat.isGroup) return msg.reply('❌ Groups only!');
        if (!args[0]) return msg.reply('Usage: .setleave [message]');
        
        const group = getGroup(chat.id._serialized);
        group.leaveMsg = args.join(' ');
        saveData();
        await msg.reply('✅ Leave message set!');
    },
    
    purge: async (msg) => await msg.reply('🗑️ Purge: Coming soon!'),
    
    blacklist: async (msg, args) => {
        const chat = await msg.getChat();
        if (!chat.isGroup) return msg.reply('❌ Groups only!');
        
        const mentions = await msg.getMentions();
        if (!mentions[0]) return msg.reply('❌ Tag someone!');
        
        const group = getGroup(chat.id._serialized);
        const userId = mentions[0].id._serialized;
        
        if (args[0] === 'add') {
            if (!group.blacklist.includes(userId)) {
                group.blacklist.push(userId);
                await msg.reply('✅ Blacklisted!');
            }
        } else if (args[0] === 'remove') {
            group.blacklist = group.blacklist.filter(id => id !== userId);
            await msg.reply('✅ Removed from blacklist!');
        } else {
            await msg.reply('Usage: .blacklist [add/remove] @user');
        }
        saveData();
    },
    
    promote: async (msg) => {
        const chat = await msg.getChat();
        if (!chat.isGroup) return msg.reply('❌ Groups only!');
        
        const mentions = await msg.getMentions();
        if (!mentions[0]) return msg.reply('❌ Tag someone!');
        
        try {
            await chat.promoteParticipants([mentions[0].id._serialized]);
            await msg.reply('✅ Promoted to admin!');
        } catch {
            await msg.reply('❌ Failed! Need admin.');
        }
    },
    
    demote: async (msg) => {
        const chat = await msg.getChat();
        if (!chat.isGroup) return msg.reply('❌ Groups only!');
        
        const mentions = await msg.getMentions();
        if (!mentions[0]) return msg.reply('❌ Tag someone!');
        
        try {
            await chat.demoteParticipants([mentions[0].id._serialized]);
            await msg.reply('✅ Demoted!');
        } catch {
            await msg.reply('❌ Failed! Need admin.');
        }
    },
    
    mute: async (msg, args) => {
        const chat = await msg.getChat();
        if (!chat.isGroup) return msg.reply('❌ Groups only!');
        
        const mentions = await msg.getMentions();
        if (!mentions[0]) return msg.reply('❌ Tag someone!');
        
        const group = getGroup(chat.id._serialized);
        const userId = mentions[0].id._serialized;
        
        if (!group.muted.includes(userId)) {
            group.muted.push(userId);
            await msg.reply('✅ Muted!');
        }
        saveData();
    },
    
    unmute: async (msg) => {
        const chat = await msg.getChat();
        if (!chat.isGroup) return msg.reply('❌ Groups only!');
        
        const mentions = await msg.getMentions();
        if (!mentions[0]) return msg.reply('❌ Tag someone!');
        
        const group = getGroup(chat.id._serialized);
        const userId = mentions[0].id._serialized;
        
        group.muted = group.muted.filter(id => id !== userId);
        await msg.reply('✅ Unmuted!');
        saveData();
    },
    
    hidetag: async (msg, args) => {
        const chat = await msg.getChat();
        if (!chat.isGroup) return msg.reply('❌ Groups only!');
        
        const text = args.join(' ') || 'Hidden tag!';
        const mentions = [];
        
        for (const p of chat.participants) {
            mentions.push(await client.getContactById(p.id._serialized));
        }
        
        await chat.sendMessage(text, { mentions });
    },
    
    tagall: async (msg) => {
        const chat = await msg.getChat();
        if (!chat.isGroup) return msg.reply('❌ Groups only!');
        
        let text = '╭─── ◈ TAGALL ◈ ───╮\n';
        const mentions = [];
        
        for (const p of chat.participants) {
            const contact = await client.getContactById(p.id._serialized);
            mentions.push(contact);
            text += `║ @${p.id.user}\n`;
        }
        text += '╰━━━━━━━━━━━━━━━━━╯';
        
        await chat.sendMessage(text, { mentions });
    },
    
    activity: async (msg) => {
        const chat = await msg.getChat();
        if (!chat.isGroup) return msg.reply('❌ Groups only!');
        
        const group = getGroup(chat.id._serialized);
        const sorted = Object.entries(group.activity)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        
        if (sorted.length === 0) return msg.reply('📊 No activity data yet!');
        
        let text = '╭─── ◈ TOP ACTIVE ◈ ───╮\n';
        for (const [userId, count] of sorted) {
            try {
                const contact = await client.getContactById(userId);
                const name = contact.pushname || contact.number;
                text += `║ ${name}: ${count} msgs\n`;
            } catch {
                text += `║ Unknown: ${count} msgs\n`;
            }
        }
        text += '╰━━━━━━━━━━━━━━━━━╯';
        await msg.reply(text);
    },
    
    active: async (msg) => await commands.activity(msg),
    
    inactive: async (msg) => {
        const chat = await msg.getChat();
        if (!chat.isGroup) return msg.reply('❌ Groups only!');
        
        const group = getGroup(chat.id._serialized);
        const allMembers = chat.participants.map(p => p.id._serialized);
        const activeMembers = Object.keys(group.activity);
        const inactive = allMembers.filter(id => !activeMembers.includes(id));
        
        if (inactive.length === 0) return msg.reply('✅ Everyone is active!');
        
        let text = '╭─── ◈ INACTIVE ◈ ───╮\n';
        for (const userId of inactive.slice(0, 10)) {
            try {
                const contact = await client.getContactById(userId);
                const name = contact.pushname || contact.number;
                text += `║ ${name}\n`;
            } catch {
                text += `║ Unknown\n`;
            }
        }
        text += `╰━━━━━━━━━━━━━━━━━╯\nTotal: ${inactive.length}`;
        await msg.reply(text);
    },
    
    open: async (msg) => {
        const chat = await msg.getChat();
        if (!chat.isGroup) return msg.reply('❌ Groups only!');
        
        try {
            await chat.setMessagesAdminsOnly(false);
            await msg.reply('✅ Group opened!');
        } catch {
            await msg.reply('❌ Failed! Need admin.');
        }
    },
    
    close: async (msg) => {
        const chat = await msg.getChat();
        if (!chat.isGroup) return msg.reply('❌ Groups only!');
        
        try {
            await chat.setMessagesAdminsOnly(true);
            await msg.reply('🔒 Group closed!');
        } catch {
            await msg.reply('❌ Failed! Need admin.');
        }
    },
    
    ttt: async (msg) => await msg.reply('❌ Tic-tac-toe coming soon!'),
    startbattle: async (msg) => await msg.reply('⚔️ Battle system coming soon!'),
    akinator: async (msg) => await msg.reply('🧞 Akinator coming soon!'),
    aki: async (msg) => commands.akinator(msg),
    greekgod: async (msg) => await msg.reply('⚡ Greek God game coming soon!'),
    gg: async (msg) => commands.greekgod(msg),
    c4: async (msg) => await msg.reply('🔴 Connect 4 coming soon!'),
    wcg: async (msg) => await msg.reply('🎮 Word Chain Game coming soon!'),
    chess: async (msg) => await msg.reply('♟️ Chess coming soon!'),
    
    support: async (msg) => {
        await msg.reply(`╭─── ◈ SUPPORT ◈ ───╮
║ 👤 Creator: ${CREATOR}
║ 🤖 Bot: ${BOT_NAME}
║ 📧 Contact: [Your contact]
╰━━━━━━━━━━━━━━━━━╯`);
    }
};

// PAIRING CODE HANDLER
let pairingCodeRequested = false;

client.on('qr', async () => {
    if (!pairingCodeRequested) {
        const phoneNumber = process.env.PHONE_NUMBER;
        
        if (phoneNumber) {
            try {
                console.log('╭━━━━━━━━━━━━━━━━━━━━━━━╮');
                console.log('║  REQUESTING PAIRING   ║');
                console.log('║       CODE...         ║');
                console.log('╰━━━━━━━━━━━━━━━━━━━━━━━╯');
                
                const code = await client.requestPairingCode(phoneNumber);
                
                console.log('');
                console.log('╭━━━━━━━━━━━━━━━━━━━━━━━╮');
                console.log('║   YOUR PAIRING CODE   ║');
                console.log('║                       ║');
                console.log(`║      ${code}          ║`);
                console.log('║                       ║');
                console.log('╰━━━━━━━━━━━━━━━━━━━━━━━╯');
                console.log('');
                console.log('📱 Steps to link:');
                console.log('1. Open WhatsApp');
                console.log('2. Settings → Linked Devices');
                console.log('3. Link a Device');
                console.log('4. Link with phone number instead');
                console.log(`5. Enter: ${code}`);
                console.log('');
                
                pairingCodeRequested = true;
            } catch (error) {
                console.error('❌ Pairing code error:', error);
                console.log('Make sure PHONE_NUMBER env var is set correctly!');
            }
        } else {
            console.log('╭━━━━━━━━━━━━━━━━━━━━━━━╮');
            console.log('║  PHONE NUMBER NEEDED  ║');
            console.log('╰━━━━━━━━━━━━━━━━━━━━━━━╯');
            console.log('');
            console.log('❌ PHONE_NUMBER environment variable not set!');
            console.log('');
            console.log('Set it with your WhatsApp number:');
            console.log('Example: export PHONE_NUMBER=1234567890');
            console.log('(Include country code, no + sign)');
            console.log('');
        }
    }
});

// Message handler
client.on('message', async (msg) => {
    try {
        const chat = await msg.getChat();
        const body = msg.body.trim();
        
        if (chat.isGroup) {
            const group = getGroup(chat.id._serialized);
            if (!group.activity[msg.from]) group.activity[msg.from] = 0;
            group.activity[msg.from]++;
            
            if (group.muted.includes(msg.from)) {
                await msg.delete(true);
                return;
            }
            
            if (group.antilink && (body.includes('chat.whatsapp.com') || body.includes('wa.me'))) {
                const participant = chat.participants.find(p => p.id._serialized === msg.from);
                
                if (participant && !participant.isAdmin) {
                    await msg.reply('⚠️ Links not allowed!');
                    await msg.delete(true);
                    
                    if (group.antilinkAction === 'kick') {
                        try {
                            await chat.removeParticipants([msg.from]);
                        } catch {}
                    }
                    return;
                }
            }
        }
        
        if (!body.startsWith(PREFIX)) return;
        
        const args = body.slice(PREFIX.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        
        if (commands[commandName]) {
            console.log(`[CMD] ${commandName} by ${msg.from}`);
            await commands[commandName](msg, args);
            
            const user = getUser(msg.from);
            user.xp += 10;
            if (user.xp >= user.level * 100) {
                user.level++;
                user.xp = 0;
                await msg.reply(`🎉 Level ${user.level}!`);
            }
            saveData();
        }
    } catch (error) {
        console.error('Error:', error);
        await msg.reply('❌ Error occurred!');
    }
});

// Group events
client.on('group_join', async (notification) => {
    try {
        const chat = await notification.getChat();
        const group = getGroup(chat.id._serialized);
        
        if (group.welcome) {
            const contact = await client.getContactById(notification.id.participant);
            const welcomeMsg = group.welcomeMsg.replace('@user', `@${contact.number}`);
            await chat.sendMessage(welcomeMsg, { mentions: [contact] });
        }
    } catch (e) {
        console.error('Welcome error:', e);
    }
});

client.on('group_leave', async (notification) => {
    try {
        const chat = await notification.getChat();
        const group = getGroup(chat.id._serialized);
        
        if (group.leave) {
            const contact = await client.getContactById(notification.id.participant);
            const leaveMsg = group.leaveMsg.replace('@user', `@${contact.number}`);
            await chat.sendMessage(leaveMsg);
        }
    } catch (e) {
        console.error('Leave error:', e);
    }
});

client.on('ready', () => {
    console.log('╭━━ ✦彡  𝚴𝚵𝚾𝚯𝚪𝚫  彡✦ ━━╮');
    console.log('║    BOT IS READY!     ║');
    console.log(`║  Prefix: ${PREFIX}            ║`);
    console.log(`║  Creator: ${CREATOR}        ║`);
    console.log('╰━━━━━━━━━━━━━━━━━━━━━╯');
    loadData();
});

client.on('auth_failure', () => {
    console.error('❌ Authentication failed!');
});

client.on('disconnected', (reason) => {
    console.log('⚠️ Disconnected:', reason);
});

setInterval(saveData, 300000);

process.on('SIGINT', () => {
    console.log('\n💾 Saving data...');
    saveData();
    console.log('👋 Shutting down...');
    process.exit(0);
});

client.initialize();

console.log('╭━━━━━━━━━━━━━━━━━━━━╮');
console.log('║  🚀 STARTING BOT   ║');
console.log('╰━━━━━━━━━━━━━━━━━━━━╯');
