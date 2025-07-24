import { downloadDiceBearAvatars, DICEBEAR_CONFIG } from './download-dicebear.js';

// Predefined style configurations
const STYLE_PRESETS = {
    thumbs: {
        style: 'thumbs',
        description: 'Simple thumb-style avatars (great for profiles)'
    },
    avataaars: {
        style: 'avataaars',
        description: 'Sketch-style avatars similar to Notion'
    },
    personas: {
        style: 'personas',
        description: 'Detailed person avatars'
    },
    adventurer: {
        style: 'adventurer',
        description: 'Adventure-themed avatars'
    },
    bottts: {
        style: 'bottts',
        description: 'Robot/bot style avatars'
    },
    'big-smile': {
        style: 'big-smile',
        description: 'Happy, smiling avatars'
    },
    micah: {
        style: 'micah',
        description: 'Illustrated person avatars'
    },
    'pixel-art': {
        style: 'pixel-art',
        description: '8-bit pixel style avatars'
    },
    shapes: {
        style: 'shapes',
        description: 'Abstract geometric avatars'
    },
    initials: {
        style: 'initials',
        description: 'Letter-based avatars'
    }
};

/**
 * Run DiceBear download with a specific style
 */
async function runDiceBearStyle(styleName = 'thumbs', count = 50) {
    const preset = STYLE_PRESETS[styleName];
    
    if (!preset) {
        console.error(`❌ Unknown style: ${styleName}`);
        console.log('Available styles:', Object.keys(STYLE_PRESETS).join(', '));
        return;
    }
    
    console.log(`🎨 Downloading ${styleName} style avatars`);
    console.log(`📝 Description: ${preset.description}`);
    console.log(`📊 Count: ${count} avatars`);
    
    // Apply style configuration
    DICEBEAR_CONFIG.defaultStyle = preset.style;
    DICEBEAR_CONFIG.numberOfAvatars = count;
    DICEBEAR_CONFIG.outputDir = `./dicebear-avatars/${styleName}`;
    
    // Download the avatars
    return await downloadDiceBearAvatars();
}

/**
 * Download multiple styles at once
 */
async function downloadMultipleStyles(styles = ['thumbs', 'avataaars', 'personas'], countPerStyle = 20) {
    console.log('🎨 Multi-Style DiceBear Download');
    console.log('===============================');
    console.log(`📋 Styles: ${styles.join(', ')}`);
    console.log(`📊 ${countPerStyle} avatars per style`);
    console.log(`📈 Total avatars: ${styles.length * countPerStyle}`);
    
    const results = [];
    
    for (const style of styles) {
        console.log(`\n🚀 Starting ${style} style...`);
        try {
            const result = await runDiceBearStyle(style, countPerStyle);
            results.push({ style, ...result });
        } catch (error) {
            console.error(`❌ Failed to download ${style} style:`, error.message);
            results.push({ style, error: error.message });
        }
    }
    
    // Summary
    console.log('\n🎉 MULTI-STYLE DOWNLOAD COMPLETE!');
    console.log('=================================');
    results.forEach(result => {
        if (result.error) {
            console.log(`❌ ${result.style}: Failed - ${result.error}`);
        } else {
            console.log(`✅ ${result.style}: ${result.successCount}/${result.successCount + result.failCount} avatars`);
        }
    });
    
    return results;
}

// Handle command line arguments
const args = process.argv.slice(2);
const command = args[0] || 'single';

if (command === 'single') {
    const style = args[1] || 'thumbs';
    const count = parseInt(args[2]) || 50;
    runDiceBearStyle(style, count).catch(error => {
        console.error('❌ Error:', error);
        process.exit(1);
    });
} else if (command === 'multi') {
    const styles = args.slice(1).length > 0 ? args.slice(1) : ['thumbs', 'avataaars', 'personas'];
    const countPerStyle = 20;
    downloadMultipleStyles(styles, countPerStyle).catch(error => {
        console.error('❌ Error:', error);
        process.exit(1);
    });
} else if (command === 'list') {
    console.log('🎨 Available DiceBear Styles:');
    console.log('============================');
    Object.entries(STYLE_PRESETS).forEach(([key, preset]) => {
        console.log(`${key.padEnd(15)} - ${preset.description}`);
    });
    console.log('\nUsage Examples:');
    console.log('node dicebear-styles.js single thumbs 50');
    console.log('node dicebear-styles.js multi thumbs avataaars personas');
    console.log('node dicebear-styles.js list');
} else {
    console.log('❌ Unknown command. Use: single, multi, or list');
}

export { runDiceBearStyle, downloadMultipleStyles, STYLE_PRESETS };
