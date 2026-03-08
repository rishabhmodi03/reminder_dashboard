const fs = require('fs');
const path = require('path');

function replaceFile(filePath) {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
    let content = fs.readFileSync(filePath, 'utf8');

    // Replace classes intelligently
    const replacements = [
        [/\bbg-gray-950\b/g, 'bg-gray-50 dark:bg-gray-950'],
        [/\bbg-gray-900\b/g, 'bg-white dark:bg-gray-900'],
        [/\bbg-gray-800\b/g, 'bg-gray-100 dark:bg-gray-800'],
        [/\bbg-gray-700\b/g, 'bg-gray-200 dark:bg-gray-700'],
        
        [/\btext-white\b/g, 'text-gray-900 dark:text-white'],
        [/\btext-gray-50\b/g, 'text-gray-900 dark:text-gray-50'],
        [/\btext-gray-100\b/g, 'text-gray-800 dark:text-gray-100'],
        [/\btext-gray-200\b/g, 'text-gray-700 dark:text-gray-200'],
        [/\btext-gray-300\b/g, 'text-gray-600 dark:text-gray-300'],
        [/\btext-gray-400\b/g, 'text-gray-500 dark:text-gray-400'],
        [/\btext-gray-500\b/g, 'text-gray-500 dark:text-gray-400'], // flipped slightly, usually gray-500 stays or becomes gray-400
        
        [/\bborder-gray-800\b/g, 'border-gray-200 dark:border-gray-800'],
        [/\bborder-gray-700\b/g, 'border-gray-300 dark:border-gray-700'],
        [/\bborder-gray-600\b/g, 'border-gray-400 dark:border-gray-600']
    ];

    let newContent = content;
    // Special handling for the script to not match already converted ones if run twice. 
    // It's a one-shot script anyway.
    for (const [regex, replacement] of replacements) {
        newContent = newContent.replace(regex, replacement);
    }

    if (newContent !== content) {
        fs.writeFileSync(filePath, newContent);
        console.log(`Updated ${filePath}`);
    }
}

function walk(dir) {
    for (const file of fs.readdirSync(dir)) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath);
        } else {
            replaceFile(fullPath);
        }
    }
}

walk('./src');
