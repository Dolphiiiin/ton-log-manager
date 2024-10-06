let currentState = {};
let logHistory = [];
let startupTime = Date.now();

window.electronAPI.onWebSocketData((data) => {
    updateState(data);
    updateUI();
});

// let isAliveValue = false; // Variable to store the Value
let isAliveValue = [];


function updateState(data) {
    if (data.Type === 'CONNECTED') {
        data.Args.forEach(arg => updateState(arg));
    } else {
        currentState[data.Type] = data;
        logHistory.push({
            timestamp: new Date().toISOString(),
            raw: JSON.stringify(data), // Add Raw field
            ...data
        });

        // Save the Value if Type is STATS and Name is IsAlive
        if (data.Type === 'STATS' && data.Name === 'IsAlive') {
            isAliveValue.push(data.Value);
            if (isAliveValue.length > 2) {
                isAliveValue.shift();
            }
        }

        // Check if the log entry should trigger a copy to FormatedLog
        if (data.Type === 'ROUND_ACTIVE' && data.Value === false && (Date.now() - startupTime) > 10000) {
            const round = currentState['ROUND_TYPE'] || {};
            const terrors = currentState['TERRORS'] || {};
            const location = currentState['LOCATION'] || {};

            // Skip recording if ROUND_TYPE is Intermission
            if (round.DisplayName === 'Intermission') {
                return;
            }

            logHistory.push({
                timestamp: new Date().toISOString(),
                type: 'FORMATED_LOG',
                roundType: round.DisplayName || 'N/A',
                terrors: terrors.DisplayName || 'N/A',
                location: location.Name ? `${location.Name} by ${location.Creator || 'Unknown'}` : 'N/A',
                alived: isAliveValue[0] // Include the saved Value
            });
        }
    }
}



function formatValue(value) {
    if (typeof value === 'boolean') {
        return value ? '✅ Yes' : '❌ No';
    }
    return value;
}

function getContrastColor(hexcolor) {
    if (typeof hexcolor === 'number') {
        hexcolor = hexcolor.toString(16);
    }

    hexcolor = hexcolor.replace('#', '');
    while (hexcolor.length < 6) {
        hexcolor = '0' + hexcolor;
    }

    const r = parseInt(hexcolor.substr(0, 2), 16);
    const g = parseInt(hexcolor.substr(2, 2), 16);
    const b = parseInt(hexcolor.substr(4, 2), 16);

    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
}

function createTableRow(key, value) {
    if (value === undefined || value === null) return '';
    if (key === 'Type') return '';
    if (typeof value === 'object' && !Array.isArray(value)) return '';

    return `<tr><td>${key}</td><td>${formatValue(value)}</td></tr>`;
}

function getTerrorCommand(command) {
    const commands = {
        0: 'Set',
        1: 'Revealed',
        2: 'Unknown',
        4: 'Undecided',
        255: 'Reset'
    };
    return commands[command] || command;
}

function formatEventDetails(event) {
    let html = '';

    switch (event.Type) {
        case 'TERRORS':
            const bgColorHex = event.DisplayColor.toString(16);
            const textColor = getContrastColor(event.DisplayColor);
            let displayName = event.DisplayName || 'N/A';

            // Check if ROUND_TYPE is Bloodbath and transform TERRORS display
            const round = currentState['ROUND_TYPE'] || {};
            if (round.DisplayName === 'Bloodbath') {
                const names = displayName.split(' & ');
                if (names.length > 1) {
                    displayName = `${names[1]} & ??? & ???`;
                }
            }

            html = `
                <div class="terror-card">
                    <table class="details-table">
                        ${createTableRow('Display Name', displayName)}
                    </table>
                </div>
            `;
            break;

        case 'ROUND_TYPE':
            html = `<table class="details-table">
                ${createTableRow('Status', event.Command === 1 ? 'Started' : 'Ended')}
                ${createTableRow('Display Name', event.DisplayName)}
            </table>`;
            break;

        case 'LOCATION':
            html = `<table class="details-table">
                ${createTableRow('Action', event.Command === 1 ? 'Set' : 'Reset')}
                ${createTableRow('Name', event.Name)}
                ${createTableRow('Creator', event.Creator)}
                ${createTableRow('Origin', event.Origin)}
            </table>`;
            break;

        default:
            html = '<table class="details-table">';
            Object.keys(event).forEach(key => {
                html += createTableRow(key, event[key]);
            });
            html += '</table>';
    }

    return html;
}

function createStateTable(activeTab) {
    let filteredState = activeTab === 'ALL'
        ? currentState
        : { [activeTab]: currentState[activeTab] };

    let html = '';
    for (let type in filteredState) {
        if (filteredState[type]) {
            const eventData = filteredState[type];
            let headerStyle = '';

            if (type === 'TERRORS') {
                const textColor = getContrastColor(eventData.DisplayColor);
                headerStyle = `style="background-color: #${eventData.DisplayColor.toString(16)}; color: ${textColor}"`;
            }

            html += `
        <div class="event-card">
          <h3 ${headerStyle}>${type}</h3>
          ${formatEventDetails(eventData)}
        </div>
      `;
        }
    }
    return html || '<p>No current state data</p>';
}

function createQuickViewTable() {
    const round = currentState['ROUND_TYPE'] || {};
    const terrors = currentState['TERRORS'] || {};
    const location = currentState['LOCATION'] || {};

    let terrorCell = '';
    if (terrors.DisplayColor) {
        const bgColorHex = terrors.DisplayColor.toString(16);
        const textColor = getContrastColor(terrors.DisplayColor);
        let displayName = terrors.DisplayName || 'N/A';

        // Check if ROUND_TYPE is Bloodbath and transform TERRORS display
        if (round.DisplayName === 'Bloodbath') {
            const names = displayName.split(' & ');
            if (names.length > 1) {
                displayName = `${names[1]} & ??? & ???`;
            }
        }

        terrorCell = `
            <td class="terror-cell">
                <div class="terror-content" style="background-color: #${bgColorHex}; color: ${textColor}">
                    ${displayName}
                </div>
            </td>
        `;
    } else {
        terrorCell = '<td>N/A</td>';
    }

    return `
        <table class="quick-view-table">
            <tr>
                <th>ROUND_TYPE</th>
                <th>TERRORS</th>
                <th>LOCATION</th>
            </tr>
            <tr>
                <td>${round.DisplayName || 'N/A'}</td>
                ${terrorCell}
                <td>${location.Name ? `${location.Name} by ${location.Creator || 'Unknown'}` : 'N/A'}</td>
            </tr>
        </table>
    `;
}

function createLogTable(activeTab) {
    let logEntries = logHistory
        .filter(log =>
            (activeTab === 'ALL' || log.Type === activeTab) &&
            !(log.Type === 'ROUND_TYPE' && log.DisplayName === 'Intermission') &&
            !(log.Type === 'TERRORS' && log.DisplayName === '???')
        )
        .map(log => {
            let value = '';
            let highlightStyle = '';

            switch (log.Type) {
                case 'ROUND_TYPE':
                    value = log.DisplayName;
                    if (value !== 'Classic' || log.Command === 255) {  // Include reset events
                        highlightStyle = 'background-color: var(--highlight-color);';
                    }
                    break;
                case 'TERRORS':
                    const bgColorHex = log.DisplayColor.toString(16);
                    const textColor = getContrastColor(log.DisplayColor);
                    value = `<div class="terror-content" style="background-color: #${bgColorHex}; color: ${textColor}">
                    ${log.DisplayName || 'N/A'}
                </div>`;
                    break;
                case 'LOCATION':
                    value = `${log.Name} by ${log.Creator || 'Unknown'}`;
                    break;
            }

            if (!value) {
                const displayItems = {
                    'Name': log.Name,
                    'Value': log.Value,
                    'Event': log.event,
                    'Args': log.args
                };
                value = Object.entries(displayItems)
                    .filter(([key, value]) => value !== undefined)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join('<br>');
            }

            return {
                timestamp: log.timestamp,
                type: log.Type,
                value: value,
                raw: log.raw, // Include Raw field
                highlightStyle: highlightStyle
            };
        });

    if (logEntries.length === 0) {
        return '';
    }

    // Reverse the order of log entries
    logEntries.reverse();

    let html = `
    <table class="log-table">
        <tr>
            <th>Time</th>
            ${activeTab === 'ALL' ? '<th>Type</th>' : ''} <!-- Include Type column only for ALL tab -->
            <th class="value-column">Value</th> <!-- Apply value-column class -->
            ${activeTab === 'ALL' ? '<th>Raw</th>' : ''} <!-- Include Raw column only for ALL tab -->
        </tr>
`;

    logEntries.forEach(entry => {
        html += `
        <tr style="${entry.highlightStyle}">
            <td>${new Date(entry.timestamp).toLocaleTimeString()}</td>
            ${activeTab === 'ALL' ? `<td>${entry.type}</td>` : ''} <!-- Include Type data only for ALL tab -->
            <td class="value-column">${entry.value}</td> <!-- Apply value-column class -->
            ${activeTab === 'ALL' ? `<td>${entry.raw}</td>` : ''} <!-- Include Raw data only for ALL tab -->
        </tr>
    `;
    });

    html += '</table>';
    return html;
}

function createFormatedLogTable() {
    let html = `
        <table class="formated-log-table">
            <tr>
                <th>Time</th>
                <th>ROUND_TYPE</th>
                <th>TERRORS</th>
                <th>LOCATION</th>
                <th>Alived</th> <!-- Add Alived column header -->
            </tr>
    `;

    // Reverse the logHistory array to show the latest entries first
    logHistory.slice().reverse().forEach(log => {
        if (log.type === 'FORMATED_LOG') {
            let roundTypeStyle = '';
            let terrorsStyle = '';

            // Set background color for ROUND_TYPE if it's not 'Classic'
            if (log.roundType && log.roundType !== 'N/A' && log.roundType !== 'Classic') {
                roundTypeStyle = 'background-color: var(--highlight-color);'; // Use the highlight color
            }

            // Set background color for TERRORS
            if (log.terrors && log.terrors !== 'N/A' && log.terrors.DisplayColor) {
                const bgColorHex = log.terrors.DisplayColor.toString(16);
                const textColor = getContrastColor(log.terrors.DisplayColor);
                terrorsStyle = `background-color: #${bgColorHex}; color: ${textColor};`;
            }

            html += `
                <tr>
                    <td>${new Date(log.timestamp).toLocaleTimeString()}</td>
                    <td style="${roundTypeStyle}">${log.roundType}</td>
                    <td style="${terrorsStyle}">${log.terrors}</td>
                    <td>${log.location}</td>
                    <td>${log.alived ? '✅' : '❌'}</td> <!-- Display the saved Value -->
                </tr>
            `;
        }
    });

    html += '</table>';
    return html;
}

let pageLoadTime = Date.now();

function updateUI() {
    const activeTabButton = document.querySelector('.tab-button.active');
    if (!activeTabButton) {
        console.error('No active tab found');
        return;
    }

    const activeTab = activeTabButton.dataset.tab;
    const currentStateDiv = document.getElementById('current-state');
    const quickViewDiv = document.getElementById('quick-view');
    const formatedLogDiv = document.getElementById('formated-log');

    // Update Quick View section
    quickViewDiv.innerHTML = createQuickViewTable();

    let currentStateHtml = '';
    switch (activeTab) {
        case '3split':
            currentStateHtml = `
                <div class="section">
                    ${createStateTable('TERRORS')}
                </div>
                <div class="section">
                    ${createStateTable('ROUND_TYPE')}
                </div>
                <div class="section">
                    ${createStateTable('LOCATION')}
                </div>
            `;
            break;
        default:
            currentStateHtml = `
                <div class="section">
                    ${createStateTable(activeTab)}
                </div>
            `;
    }

    const logTableHtml = `
        <div class="section">
            ${createLogTable(activeTab)}
        </div>
    `;

    currentStateDiv.innerHTML = currentStateHtml + logTableHtml;
    formatedLogDiv.innerHTML = createFormatedLogTable();
}

document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', (e) => {
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        updateUI();
    });
});