#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const INPUT_FILE = './data/schedule.json';
const OUTPUT_FILE = './schedule-handout.html';

// Room order as specified
const ROOM_ORDER = [
    '05 Broadway',
    '05 Marquis', 
    '05 Music Box',
    '05 New Amsterdam',
    '05 Winter Garden',
    '06 Ambassador',
    '06 Belasco',
    '06 Radio City'
];

function parseScheduleData() {
    console.log('📖 Reading schedule data...');
    const rawData = fs.readFileSync(INPUT_FILE, 'utf8');
    const schedule = JSON.parse(rawData);
    
    // Extract sessions by room and time slot
    const sessionsByTimeSlot = new Map();
    
    // Process each day's data
    schedule.forEach(day => {
        day.rooms.forEach(room => {
            room.sessions.forEach(session => {
                const startTime = new Date(session.startsAt);
                const endTime = new Date(session.endsAt);
                const timeSlot = formatTimeSlot(startTime, endTime);
                
                if (!sessionsByTimeSlot.has(timeSlot)) {
                    sessionsByTimeSlot.set(timeSlot, new Map());
                }
                
                const timeSlotData = sessionsByTimeSlot.get(timeSlot);
                
                // Extract track and level from categories
                let track = '';
                let level = '';
                
                if (session.categories) {
                    const trackCategory = session.categories.find(cat => cat.name === 'Track');
                    if (trackCategory && trackCategory.categoryItems && trackCategory.categoryItems.length > 0) {
                        let tracks = trackCategory.categoryItems.map(item => item.name);
                        
                        // Trim to max 3 tracks, prioritizing based on session title
                        if (tracks.length > 3) {
                            tracks = selectBestTracks(session.title, tracks);
                        }
                        
                        track = tracks.join(', ');
                    }
                    
                    const levelCategory = session.categories.find(cat => cat.name === 'Level');
                    if (levelCategory && levelCategory.categoryItems && levelCategory.categoryItems.length > 0) {
                        level = levelCategory.categoryItems[0].name;
                    }
                }
                
                timeSlotData.set(room.name, {
                    title: session.title,
                    speakers: session.speakers.map(s => s.name).join(', ') || 'TBD',
                    track: track,
                    level: level,
                    isService: session.isServiceSession || false
                });
            });
        });
    });
    
    return sessionsByTimeSlot;
}

function formatTimeSlot(startTime, endTime) {
    const options = { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
    };
    
    const start = startTime.toLocaleTimeString('en-US', options);
    const end = endTime.toLocaleTimeString('en-US', options);
    
    return `${start} - ${end}`;
}

function selectBestTracks(sessionTitle, tracks) {
    const titleLower = sessionTitle.toLowerCase();
    
    // Track relevance scoring based on keywords in session title
    const trackScores = tracks.map(track => {
        let score = 0;
        const trackLower = track.toLowerCase();
        
        // Direct mentions get highest score
        if (titleLower.includes(trackLower.replace(' & ', ' ').replace('/', '').replace(' ', ''))) {
            score += 10;
        }
        
        // Keyword-based scoring
        switch (track) {
            case 'Copilot':
                if (titleLower.includes('copilot') || titleLower.includes('ai') || titleLower.includes('agent')) score += 8;
                break;
            case 'SharePoint':
                if (titleLower.includes('sharepoint') || titleLower.includes('intranet') || titleLower.includes('content')) score += 8;
                break;
            case 'Power Platform':
                if (titleLower.includes('power') || titleLower.includes('automate') || titleLower.includes('apps') || titleLower.includes('dataverse')) score += 8;
                break;
            case 'MS Teams':
                if (titleLower.includes('teams') || titleLower.includes('collaboration') || titleLower.includes('meeting')) score += 8;
                break;
            case 'Azure':
                if (titleLower.includes('azure') || titleLower.includes('cloud') || titleLower.includes('deployment')) score += 8;
                break;
            case 'Artificial Intelligence':
                if (titleLower.includes('ai') || titleLower.includes('artificial') || titleLower.includes('intelligence') || titleLower.includes('chatbot') || titleLower.includes('gen ai')) score += 8;
                break;
            case 'M365 Config / Mgmt':
                if (titleLower.includes('governance') || titleLower.includes('security') || titleLower.includes('management') || titleLower.includes('config')) score += 8;
                break;
            case 'M365 Apps':
                if (titleLower.includes('office') || titleLower.includes('apps') || titleLower.includes('word') || titleLower.includes('excel')) score += 8;
                break;
            case 'Viva':
                if (titleLower.includes('viva') || titleLower.includes('amplify') || titleLower.includes('engagement')) score += 8;
                break;
            case 'Business & Productivity':
                if (titleLower.includes('business') || titleLower.includes('productivity') || titleLower.includes('workflow')) score += 6;
                break;
        }
        
        return { track, score };
    });
    
    // Sort by score descending and take top 3
    return trackScores
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(item => item.track);
}

function getTrackCSSClass(trackName) {
    const trackMap = {
        'Copilot': 'tag-copilot',
        'SharePoint': 'tag-sharepoint',
        'Power Platform': 'tag-power-platform',
        'MS Teams': 'tag-teams',
        'Azure': 'tag-azure',
        'Artificial Intelligence': 'tag-ai',
        'M365 Config / Mgmt': 'tag-config',
        'M365 Apps': 'tag-apps',
        'Viva': 'tag-viva',
        'Business & Productivity': 'tag-business'
    };
    
    return trackMap[trackName] || 'tag-business';
}

function formatTrackTags(trackString) {
    if (!trackString) return '';
    
    const tracks = trackString.split(', ');
    return tracks.map(track => 
        `<span class="tag ${getTrackCSSClass(track.trim())}">${track.trim()}</span>`
    ).join('');
}

function generateHTML(sessionsByTimeSlot) {
    console.log('🏗️ Generating HTML...');
    
    const timeSlots = Array.from(sessionsByTimeSlot.keys()).sort((a, b) => {
        const timeA = new Date('1970-01-01 ' + a.split(' - ')[0]);
        const timeB = new Date('1970-01-01 ' + b.split(' - ')[0]);
        return timeA - timeB;
    });
    
    let html = generateHTMLHeader();
    
    // Group sessions by blocks
    const sessionBlocks = groupSessionsIntoBlocks(timeSlots, sessionsByTimeSlot);
    
    sessionBlocks.forEach(block => {
        html += generateSessionBlockHTML(block);
    });
    
    html += generateHTMLFooter();
    
    return html;
}

function groupSessionsIntoBlocks(timeSlots, sessionsByTimeSlot) {
    const blocks = [];
    let currentBlock = null;
    
    timeSlots.forEach((timeSlot, index) => {
        const sessions = sessionsByTimeSlot.get(timeSlot);
        
        // Determine block type
        let blockType = 'session';
        let blockTitle = '';
        
        if (timeSlot.includes('8:30 AM') || timeSlot.includes('9:00 AM')) {
            blockType = 'opening';
            blockTitle = 'Opening & Registration';
        } else if (timeSlot.includes('9:30 AM')) {
            blockType = 'session';
            blockTitle = 'Morning Session Block 1 (9:30 AM - 10:20 AM)';
        } else if (timeSlot.includes('10:30 AM')) {
            blockType = 'session';
            blockTitle = 'Morning Session Block 2 (10:30 AM - 11:20 AM)';
        } else if (timeSlot.includes('11:30 AM')) {
            blockType = 'session';
            blockTitle = 'Morning Session Block 3 (11:30 AM - 12:20 PM)';
        } else if (timeSlot.includes('12:20 PM')) {
            blockType = 'lunch';
            blockTitle = 'Lunch Break';
        } else if (timeSlot.includes('1:10 PM')) {
            blockType = 'session';
            blockTitle = 'Afternoon Session Block 1 (1:10 PM - 2:00 PM)';
        } else if (timeSlot.includes('2:10 PM')) {
            blockType = 'session';
            blockTitle = 'Afternoon Session Block 2 (2:10 PM - 3:00 PM)';
        } else if (timeSlot.includes('3:10 PM') || timeSlot.includes('4:00 PM') || timeSlot.includes('5:00 PM')) {
            blockType = 'keynote';
            blockTitle = 'Keynote & Closing';
        }
        
        // Add break blocks between session blocks
        if (currentBlock && shouldAddBreak(currentBlock.title, blockTitle)) {
            const breakBlock = createBreakBlock(currentBlock.title, blockTitle);
            if (breakBlock) {
                blocks.push(breakBlock);
            }
        }
        
        // Check if we need a new block or can add to existing
        if (!currentBlock || 
            currentBlock.title !== blockTitle) {
            
            currentBlock = {
                type: blockType,
                title: blockTitle,
                timeSlots: [],
                isPageBreak: timeSlot.includes('12:20 PM') && blockType === 'lunch'
            };
            blocks.push(currentBlock);
        }
        
        currentBlock.timeSlots.push({
            timeSlot,
            sessions
        });
    });
    
    return blocks;
}

function shouldAddBreak(currentTitle, nextTitle) {
    const breakTransitions = [
        ['Opening & Registration', 'Morning Session Block 1 (9:30 AM - 10:20 AM)'],
        ['Morning Session Block 1 (9:30 AM - 10:20 AM)', 'Morning Session Block 2 (10:30 AM - 11:20 AM)'],
        ['Morning Session Block 2 (10:30 AM - 11:20 AM)', 'Morning Session Block 3 (11:30 AM - 12:20 PM)'],
        ['Afternoon Session Block 1 (1:10 PM - 2:00 PM)', 'Afternoon Session Block 2 (2:10 PM - 3:00 PM)'],
        ['Afternoon Session Block 2 (2:10 PM - 3:00 PM)', 'Keynote & Closing']
    ];
    
    return breakTransitions.some(([from, to]) => currentTitle === from && nextTitle === to);
}

function createBreakBlock(currentTitle, nextTitle) {
    const breakMap = {
        'Opening & Registration→Morning Session Block 1 (9:30 AM - 10:20 AM)': '10 minute Break',
        'Morning Session Block 1 (9:30 AM - 10:20 AM)→Morning Session Block 2 (10:30 AM - 11:20 AM)': '10 minute Break',
        'Morning Session Block 2 (10:30 AM - 11:20 AM)→Morning Session Block 3 (11:30 AM - 12:20 PM)': '10 minute Break',
        'Afternoon Session Block 1 (1:10 PM - 2:00 PM)→Afternoon Session Block 2 (2:10 PM - 3:00 PM)': '10 minute Break',
        'Afternoon Session Block 2 (2:10 PM - 3:00 PM)→Keynote & Closing': '10 minute Break'
    };
    
    const key = `${currentTitle}→${nextTitle}`;
    const breakTitle = breakMap[key];
    
    if (breakTitle) {
        return {
            type: 'break',
            title: breakTitle,
            timeSlots: [],
            isPageBreak: false
        };
    }
    
    return null;
}

function generateHTMLHeader() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>M365 NYC Conference Schedule</title>
    <style>
        @media print {
            body { font-size: 12px; margin: 0.1in; }
            .page-break { page-break-before: always; }
            .no-break { page-break-inside: avoid; }
            .time-header { width: 65px !important; font-size: 11px !important; padding: 3px !important; background-color: #E3F2FD !important; }
            .room-header { font-size: 11px !important; padding: 3px !important; }
            .session-cell { padding: 6px !important; font-size: 11px !important; }
            .session-title { font-size: 10px !important; line-height: 1.2 !important; }
            .session-speaker { font-size: 10px !important; }
            .session-meta { font-size: 8px !important; }
            .tag { font-size: 7px !important; padding: 1px 4px !important; }
            .level-pill { font-size: 10px !important; padding: 2px 6px !important; }
            .qr-code { width: 40px !important; height: 40px !important; top: 0 !important; right: 0 !important; }
            .qr-code-left { width: 40px !important; height: 40px !important; top: 0 !important; left: 0 !important; }
        }
        
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        
        body {
            font-family: Arial, sans-serif;
            color: black;
            background: white;
            padding: 5px;
            position: relative;
        }
        
        .main-title {
            text-align: center;
            color: #4472C4;
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 2px;
        }
        
        .date-subtitle {
            text-align: center;
            color: black;
            font-size: 10px;
            margin-bottom: 10px;
        }
        
        .session-block {
            margin-bottom: 0px;
        }
        
        .session-block:first-of-type {
            margin-top: 10px;
        }
        
        .page-break {
            page-break-before: always;
            position: relative;
        }
        
        .block-header {
            background-color: #D9E2F3;
            color: #4472C4;
            padding: 4px 8px;
            font-weight: bold;
            font-size: 11px;
            border: 1px solid black;
            margin-bottom: 0;
        }
        
        .session-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 0px;
            table-layout: fixed;
        }
        
        .time-header {
            background-color: #F2F2F2;
            padding: 3px;
            border: 1px solid black;
            font-weight: bold;
            font-size: 11px;
            width: 65px;
            vertical-align: top;
        }
        
        .room-header {
            background-color: #F2F2F2;
            padding: 3px;
            border: 1px solid black;
            font-weight: bold;
            font-size: 11px;
            text-align: center;
            width: calc((100% - 65px) / 8);
        }
        
        .session-cell {
            padding: 6px;
            border: 1px solid black;
            vertical-align: top;
            font-size: 11px;
            line-height: 1.2;
            width: calc((100% - 65px) / 8);
            height: 120px;
        }
        
        .session-content {
            display: flex;
            flex-direction: column;
            height: 100%;
        }
        
        .session-main {
            flex-grow: 1;
        }
        
        .session-title {
            font-weight: bold;
            color: black;
            margin-bottom: 3px;
            line-height: 1.2;
            font-size: 10px;
        }
        
        .session-speaker {
            color: black;
            font-style: italic;
            font-size: 10px;
        }
        
        .session-meta {
            font-size: 10px;
            line-height: 1.1;
            flex-grow: 1;
            margin-right: 8px;
        }
        
        .tag {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 9px;
            margin-right: 4px;
            margin-bottom: 2px;
        }
        
        .tag-copilot { background-color: #E8F5E8; color: #2E7D32; }
        .tag-sharepoint { background-color: #FFF3E0; color: #E65100; }
        .tag-power-platform { background-color: #F3E5F5; color: #7B1FA2; }
        .tag-teams { background-color: #E3F2FD; color: #1976D2; }
        .tag-azure { background-color: #E0F2F1; color: #00695C; }
        .tag-ai { background-color: #FCE4EC; color: #C2185B; }
        .tag-config { background-color: #FFF8E1; color: #F57F17; }
        .tag-apps { background-color: #F1F8E9; color: #558B2F; }
        .tag-viva { background-color: #EDE7F6; color: #512DA8; }
        .tag-business { background-color: #E8F0FE; color: #1565C0; }
        
        .qr-code {
            position: absolute;
            top: 0;
            right: 0;
            width: 50px;
            height: 50px;
        }
        
        .qr-code-left {
            position: absolute;
            top: 0;
            left: 0;
            width: 50px;
            height: 50px;
        }
        
        .session-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 4px;
        }
        
        .level-pill {
            background-color: #4472C4;
            color: white;
            padding: 3px 8px;
            border-radius: 10px;
            font-size: 12px;
            font-weight: bold;
            flex-shrink: 0;
        }
        
        .service-bg {
            background-color: #FFF2CC;
        }
        
        .service-session {
            font-weight: bold;
            color: black;
        }
        
        .empty-cell {
            color: #999;
            text-align: center;
            font-style: italic;
        }
        
        .single-room-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 0px;
        }
        
        .single-room-header {
            background-color: #F2F2F2;
            padding: 2px 4px;
            border: 1px solid black;
            font-weight: bold;
            font-size: 10px;
            width: 120px;
        }
        
        .single-room-time {
            background-color: #F2F2F2;
            padding: 2px 4px;
            border: 1px solid black;
            font-weight: bold;
            font-size: 10px;
            width: 120px;
        }
        
        .icon {
            margin-right: 4px;
        }
    </style>
</head>
<body>
    <img src="schedule.png" alt="QR Code" class="qr-code">
    <img src="schedule.png" alt="QR Code" class="qr-code-left">
    <div class="main-title">M365 NYC Conference Schedule</div>
    <div class="date-subtitle">Friday, July 25, 2025</div>

`;
}

function generateSessionBlockHTML(block) {
    let html = '';
    
    // Add page break for afternoon sessions
    if (block.isPageBreak) {
        html += `    <div class="page-break">\n`;
        html += `        <img src="schedule.png" alt="QR Code" class="qr-code">\n`;
        html += `        <img src="schedule.png" alt="QR Code" class="qr-code-left">\n`;
        html += `        <div class="main-title">M365 NYC Conference Schedule</div>\n`;
        html += `        <div class="date-subtitle">Friday, July 25, 2025</div>\n`;
        html += `    </div>\n\n`;
    }
    
    if (block.type === 'break') {
        // Compact break table with borders, touching adjacent tables
        html += `<table style="width: 100%; border-collapse: collapse; margin: 0; padding: 0;"><tr><td style="border: 1px solid black; text-align: center; padding: 2px; font-size: 10px; color: black; font-style: italic;">${block.title}</td></tr></table>`;
        return html;
    }
    
    const blockBgClass = getBlockBackgroundClass(block.type);
    
    html += `    <div class="session-block">
        <div class="block-header ${blockBgClass}">${block.title}</div>
`;
    
    if (block.type === 'opening' || block.type === 'lunch' || block.type === 'keynote') {
        // Single room layout for service sessions
        html += generateServiceBlockHTML(block);
    } else {
        // Multi-room table layout for regular sessions
        html += generateMultiRoomBlockHTML(block);
    }
    
    html += `    </div>`;
    
    return html;
}

function generateServiceBlockHTML(block) {
    let html = `        <table class="single-room-table">
`;
    
    block.timeSlots.forEach(({timeSlot, sessions}) => {
        const radioSession = sessions.get('06 Radio City');
        if (radioSession) {
            const icon = getServiceIcon(radioSession.title);
            html += `            <tr class="${getBlockBackgroundClass(block.type)}">
                <td class="single-room-time">${timeSlot}</td>
                <td class="single-room-header">06 Radio City Room</td>
                <td class="session-cell service-session" style="padding: 2px 4px; height: auto;">
                    <span class="icon">${icon}</span>${getServiceSessionTitle(radioSession.title, radioSession.speakers)}
                </td>
            </tr>
`;
        }
    });
    
    html += `        </table>
`;
    
    return html;
}

function generateMultiRoomBlockHTML(block) {
    let html = `        <table class="session-table">
            <tr>
                <th class="time-header">Time</th>
`;
    
    // Add room headers
    ROOM_ORDER.forEach(roomName => {
        html += `                <th class="room-header">${roomName}</th>
`;
    });
    
    html += `            </tr>
`;
    
    // Add session rows
    block.timeSlots.forEach(({timeSlot, sessions}) => {
        html += `            <tr>
                <td class="time-header">${timeSlot}</td>
`;
        
        ROOM_ORDER.forEach(roomName => {
            const session = sessions.get(roomName);
            html += `                <td class="session-cell">
`;
            
            if (session) {
                html += `                    <div class="session-content">
                        <div class="session-main">
                            <div class="session-title">${session.title}</div>
                            <div class="session-speaker">${session.speakers}</div>
                        </div>
`;
                
                // Add track and level if available
                if (session.track || session.level) {
                    html += `                        <div class="session-footer">
`;
                    if (session.track) {
                        html += `                            <div class="session-meta">${formatTrackTags(session.track)}</div>
`;
                    } else {
                        html += `                            <div class="session-meta"></div>
`;
                    }
                    if (session.level) {
                        html += `                            <span class="level-pill">${session.level}</span>
`;
                    }
                    html += `                        </div>
`;
                }
                html += `                    </div>
`;
            } else {
                html += `                    <div class="empty-cell">—</div>
`;
            }
            
            html += `                </td>
`;
        });
        
        html += `            </tr>
`;
    });
    
    html += `        </table>
`;
    
    return html;
}

function getBlockBackgroundClass(blockType) {
    switch (blockType) {
        case 'opening':
            return 'service-bg';
        case 'lunch':
            return 'service-bg';
        case 'keynote':
        case 'closing':
            return 'service-bg';
        case 'break':
            return 'service-bg';
        default:
            return '';
    }
}

function getServiceIcon(title) {
    if (title.toLowerCase().includes('registration')) return '🎟️';
    if (title.toLowerCase().includes('welcome') || title.toLowerCase().includes('kick off')) return '🎤';
    if (title.toLowerCase().includes('lunch')) return '🍽️';
    if (title.toLowerCase().includes('keynote')) return '⭐';
    if (title.toLowerCase().includes('closing')) return '🎁';
    if (title.toLowerCase().includes('mingle') || title.toLowerCase().includes('networking')) return '🍻';
    if (title.toLowerCase().includes('break')) return '☕';
    return '🎯';
}

function getServiceSessionTitle(title, speakers) {
    if (title.toLowerCase().includes('keynote') || title.toLowerCase().includes('catalyst')) {
        return `Keynote - ${speakers} - ${title}`;
    }
    return title;
}

function generateHTMLFooter() {
    return `    </div>
</body>
</html>`;
}

function main() {
    console.log('🚀 M365 NYC Schedule Generator Starting...');
    
    try {
        // Check if input file exists
        if (!fs.existsSync(INPUT_FILE)) {
            console.error(`❌ Error: Schedule file not found at ${INPUT_FILE}`);
            process.exit(1);
        }
        
        // Parse the schedule data
        const sessionsByTimeSlot = parseScheduleData();
        console.log(`✅ Parsed ${sessionsByTimeSlot.size} time slots`);
        
        // Generate HTML
        const html = generateHTML(sessionsByTimeSlot);
        
        // Write output file
        fs.writeFileSync(OUTPUT_FILE, html, 'utf8');
        console.log(`📄 HTML handout generated: ${OUTPUT_FILE}`);
        
        console.log('✨ Generation complete!');
        
    } catch (error) {
        console.error('❌ Error generating handout:', error.message);
        process.exit(1);
    }
}

// Run the generator
if (require.main === module) {
    main();
}

module.exports = { parseScheduleData, generateHTML };