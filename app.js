class VoiceWebSocketTester {
    constructor() {
        this.ws = null;
        this.isConnected = false;
        this.connectionStartTime = null;
        this.mediaRecorder = null;
        this.audioChunks = [];

        // Statistics
        this.stats = {
            sent: 0,
            received: 0,
            errors: 0
        };

        this.initializeUI();
        this.bindEvents();
        this.updateCurrentTime();

        // Update time every second
        setInterval(() => this.updateCurrentTime(), 1000);
    }

    initializeUI() {
        // Get DOM elements
        this.elements = {
            baseUrl: document.getElementById('baseUrl'),
            endpoint: document.getElementById('endpoint'),
            connectionStatus: document.getElementById('connectionStatus'),
            connectBtn: document.getElementById('connectBtn'),
            disconnectBtn: document.getElementById('disconnectBtn'),
            messages: document.getElementById('messages'),

            // Input type buttons
            typeButtons: document.querySelectorAll('.type-btn'),

            // Input sections
            textInput: document.getElementById('textInput'),
            jsonInput: document.getElementById('jsonInput'),
            bytesInput: document.getElementById('bytesInput'),
            voiceInput: document.getElementById('voiceInput'),

            // Message inputs
            textMessage: document.getElementById('textMessage'),
            jsonMessage: document.getElementById('jsonMessage'),
            bytesMessage: document.getElementById('bytesMessage'),

            // Send buttons
            sendTextBtn: document.getElementById('sendTextBtn'),
            sendJsonBtn: document.getElementById('sendJsonBtn'),
            sendBytesBtn: document.getElementById('sendBytesBtn'),

            // Voice controls
            startRecordBtn: document.getElementById('startRecordBtn'),
            stopRecordBtn: document.getElementById('stopRecordBtn'),
            recordingStatus: document.getElementById('recordingStatus'),

            // Quick action buttons
            pingBtn: document.getElementById('pingBtn'),
            statsBtn: document.getElementById('statsBtn'),
            broadcastBtn: document.getElementById('broadcastBtn'),
            clearBtn: document.getElementById('clearBtn'),

            // Statistics
            sentCount: document.getElementById('sentCount'),
            receivedCount: document.getElementById('receivedCount'),
            errorsCount: document.getElementById('errorsCount'),
            connectionTime: document.getElementById('connectionTime')
        };

        this.currentInputType = 'text';
        this.updateConnectionUI();
    }

    bindEvents() {
        // Connection buttons
        this.elements.connectBtn.addEventListener('click', () => this.connect());
        this.elements.disconnectBtn.addEventListener('click', () => this.disconnect());

        // Input type selection
        this.elements.typeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.type;
                this.selectInputType(type);
            });
        });

        // Send buttons
        this.elements.sendTextBtn.addEventListener('click', () => this.sendTextMessage());
        this.elements.sendJsonBtn.addEventListener('click', () => this.sendJsonMessage());
        this.elements.sendBytesBtn.addEventListener('click', () => this.sendBytesMessage());

        // Voice recording
        this.elements.startRecordBtn.addEventListener('click', () => this.startRecording());
        this.elements.stopRecordBtn.addEventListener('click', () => this.stopRecording());

        // Quick actions
        this.elements.pingBtn.addEventListener('click', () => this.sendPing());
        this.elements.statsBtn.addEventListener('click', () => this.getStats());
        this.elements.broadcastBtn.addEventListener('click', () => this.sendBroadcast());
        this.elements.clearBtn.addEventListener('click', () => this.clearMessages());

        // Enter key support for text inputs
        this.elements.textMessage.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && this.isConnected) {
                this.sendTextMessage();
            }
        });
    }

    updateCurrentTime() {
        const now = new Date();
        const utcTime = now.toISOString().replace('T', ' ').substring(0, 19);
        document.getElementById('currentTime').textContent = utcTime;
    }

    selectInputType(type) {
        // Update active button
        this.elements.typeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === type);
        });

        // Hide all input sections
        ['textInput', 'jsonInput', 'bytesInput', 'voiceInput'].forEach(id => {
            document.getElementById(id).style.display = 'none';
        });

        // Show selected input section
        document.getElementById(type + 'Input').style.display = 'block';

        this.currentInputType = type;
    }

    connect() {
        const baseUrl = this.elements.baseUrl.value.trim();
        const endpoint = this.elements.endpoint.value.trim();

        if (!baseUrl || !endpoint) {
            this.addMessage('Please enter both Base URL and Endpoint', 'error', 'system');
            return;
        }

        const fullUrl = baseUrl + endpoint;

        try {
            this.updateConnectionStatus('connecting', 'Connecting...');
            this.addMessage(`Connecting to: ${fullUrl}`, 'system', 'system');

            this.ws = new WebSocket(fullUrl);

            this.ws.onopen = (event) => {
                this.isConnected = true;
                this.connectionStartTime = new Date();
                this.updateConnectionStatus('connected', 'Connected');
                this.addMessage(`✅ Connected to ${fullUrl}`, 'system', 'system');
                this.updateConnectionUI();
                this.startConnectionTimer();
            };

            this.ws.onmessage = (event) => {
                this.stats.received++;
                this.updateStats();

                let messageData;
                try {
                    // Try to parse as JSON first
                    messageData = JSON.parse(event.data);
                    this.addMessage(`📨 Received JSON: ${JSON.stringify(messageData, null, 2)}`, 'received', 'json');
                } catch (e) {
                    // If not JSON, treat as text
                    messageData = event.data;
                    this.addMessage(`📨 Received: ${messageData}`, 'received', 'text');
                }
            };

            this.ws.onclose = (event) => {
                this.isConnected = false;
                this.updateConnectionStatus('disconnected', 'Disconnected');
                this.addMessage(`❌ Connection closed. Code: ${event.code}, Reason: ${event.reason}`, 'system', 'system');
                this.updateConnectionUI();
                this.stopConnectionTimer();
            };

            this.ws.onerror = (error) => {
                this.stats.errors++;
                this.updateStats();
                this.addMessage(`❌ WebSocket error: ${error}`, 'error', 'error');
                console.error('WebSocket error:', error);
            };

        } catch (error) {
            this.addMessage(`❌ Connection failed: ${error.message}`, 'error', 'error');
            this.updateConnectionStatus('disconnected', 'Connection Failed');
        }
    }

    disconnect() {
        if (this.ws && this.isConnected) {
            this.ws.close();
            this.addMessage('🔌 Disconnecting...', 'system', 'system');
        }
    }

    sendTextMessage() {
        const message = this.elements.textMessage.value.trim();
        if (!message) return;

        if (this.ws && this.isConnected) {
            this.ws.send(message);
            this.stats.sent++;
            this.updateStats();
            this.addMessage(`📤 Sent Text: ${message}`, 'sent', 'text');
            this.elements.textMessage.value = '';
        }
    }

    sendJsonMessage() {
        const jsonText = this.elements.jsonMessage.value.trim();
        if (!jsonText) return;

        try {
            const jsonData = JSON.parse(jsonText);

            if (this.ws && this.isConnected) {
                this.ws.send(JSON.stringify(jsonData));
                this.stats.sent++;
                this.updateStats();
                this.addMessage(`📤 Sent JSON: ${JSON.stringify(jsonData, null, 2)}`, 'sent', 'json');
            }
        } catch (error) {
            this.addMessage(`❌ Invalid JSON: ${error.message}`, 'error', 'error');
        }
    }

    sendBytesMessage() {
        const text = this.elements.bytesMessage.value.trim();
        if (!text) return;

        if (this.ws && this.isConnected) {
            const encoder = new TextEncoder();
            const bytes = encoder.encode(text);
            this.ws.send(bytes);
            this.stats.sent++;
            this.updateStats();
            this.addMessage(`📤 Sent Bytes: ${text} (${bytes.length} bytes)`, 'sent', 'bytes');
            this.elements.bytesMessage.value = '';
        }
    }

    async startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };

            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                this.sendVoiceData(audioBlob);

                // Stop all tracks to release microphone
                stream.getTracks().forEach(track => track.stop());
            };

            this.mediaRecorder.start();
            this.elements.startRecordBtn.disabled = true;
            this.elements.stopRecordBtn.disabled = false;
            this.elements.recordingStatus.textContent = '🎤 Recording... Click "Stop Recording" when done';
            this.elements.recordingStatus.style.color = '#d32f2f';

            this.addMessage('🎤 Started voice recording', 'system', 'voice');

        } catch (error) {
            this.addMessage(`❌ Microphone access denied: ${error.message}`, 'error', 'error');
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
            this.elements.startRecordBtn.disabled = false;
            this.elements.stopRecordBtn.disabled = true;
            this.elements.recordingStatus.textContent = 'Recording stopped. Processing audio...';
            this.elements.recordingStatus.style.color = '#f57c00';
        }
    }

    async sendVoiceData(audioBlob) {
        if (this.ws && this.isConnected) {
            const arrayBuffer = await audioBlob.arrayBuffer();
            this.ws.send(arrayBuffer);
            this.stats.sent++;
            this.updateStats();
            this.addMessage(`📤 Sent Voice Data: ${(arrayBuffer.byteLength / 1024).toFixed(2)} KB`, 'sent', 'voice');
            this.elements.recordingStatus.textContent = 'Voice data sent successfully!';
            this.elements.recordingStatus.style.color = '#388e3c';

            // Reset status after 3 seconds
            setTimeout(() => {
                this.elements.recordingStatus.textContent = 'Click "Start Recording" to begin voice capture';
                this.elements.recordingStatus.style.color = '#666';
            }, 3000);
        }
    }

    sendPing() {
        if (this.ws && this.isConnected) {
            this.ws.send('ping');
            this.stats.sent++;
            this.updateStats();
            this.addMessage('📤 Sent: ping', 'sent', 'ping');
        }
    }

    getStats() {
        if (this.ws && this.isConnected) {
            this.ws.send('get_stats');
            this.stats.sent++;
            this.updateStats();
            this.addMessage('📤 Requested statistics', 'sent', 'stats');
        }
    }

    sendBroadcast() {
        if (this.ws && this.isConnected) {
            const message = `broadcast:Hello everyone! This is abubasith456 at ${new Date().toISOString().replace('T', ' ').substring(0, 19)}`;
            this.ws.send(message);
            this.stats.sent++;
            this.updateStats();
            this.addMessage(`📤 Sent Broadcast: ${message}`, 'sent', 'broadcast');
        }
    }

    clearMessages() {
        this.elements.messages.innerHTML = '';
        this.addMessage('🧹 Messages cleared', 'system', 'system');
    }

    addMessage(content, type, category) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;

        const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const icon = this.getMessageIcon(category);

        messageDiv.innerHTML = `
            <div><strong>${icon} ${category.toUpperCase()}</strong> <span class="timestamp">${timestamp}</span></div>
            <div style="margin-top: 5px; white-space: pre-wrap;">${content}</div>
        `;

        this.elements.messages.appendChild(messageDiv);
        this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
    }

    getMessageIcon(category) {
        const icons = {
            'system': '⚙️',
            'text': '💬',
            'json': '📋',
            'bytes': '📄',
            'voice': '🎤',
            'ping': '🏓',
            'stats': '📊',
            'broadcast': '📢',
            'error': '❌'
        };
        return icons[category] || '📝';
    }

    updateConnectionStatus(status, text) {
        this.elements.connectionStatus.className = `status ${status}`;
        const icons = {
            'disconnected': 'fas fa-times-circle',
            'connecting': 'fas fa-spinner fa-spin',
            'connected': 'fas fa-check-circle'
        };
        this.elements.connectionStatus.innerHTML = `<i class="${icons[status]}"></i> ${text}`;
    }

    updateConnectionUI() {
        const buttons = [
            'sendTextBtn', 'sendJsonBtn', 'sendBytesBtn',
            'pingBtn', 'statsBtn', 'broadcastBtn'
        ];

        buttons.forEach(btnId => {
            this.elements[btnId].disabled = !this.isConnected;
        });

        this.elements.connectBtn.disabled = this.isConnected;
        this.elements.disconnectBtn.disabled = !this.isConnected;

        // Voice recording buttons
        this.elements.startRecordBtn.disabled = !this.isConnected;
    }

    updateStats() {
        this.elements.sentCount.textContent = this.stats.sent;
        this.elements.receivedCount.textContent = this.stats.received;
        this.elements.errorsCount.textContent = this.stats.errors;
    }

    startConnectionTimer() {
        this.connectionTimer = setInterval(() => {
            if (this.connectionStartTime) {
                const now = new Date();
                const diff = Math.floor((now - this.connectionStartTime) / 1000);
                const minutes = Math.floor(diff / 60);
                const seconds = diff % 60;
                this.elements.connectionTime.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
    }

    stopConnectionTimer() {
        if (this.connectionTimer) {
            clearInterval(this.connectionTimer);
            this.connectionTimer = null;
        }
        this.elements.connectionTime.textContent = '--';
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new VoiceWebSocketTester();
});