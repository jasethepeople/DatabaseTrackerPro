#!/bin/bash
set -e

# AI Agent System - VMware Automated Setup Script
# This script automates the deployment of AI Agent System on VMware VMs

echo "🖥️ AI Agent System - VMware Deployment Script"
echo "=============================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   error "This script should not be run as root for security reasons"
fi

# System information
log "Detecting system information..."
OS=$(lsb_release -si 2>/dev/null || echo "Unknown")
VERSION=$(lsb_release -sr 2>/dev/null || echo "Unknown")
ARCH=$(uname -m)

log "Operating System: $OS $VERSION"
log "Architecture: $ARCH"

# Verify VMware environment
log "Checking VMware environment..."
if command -v vmware-toolbox-cmd &> /dev/null; then
    VMWARE_VERSION=$(vmware-toolbox-cmd -v 2>/dev/null || echo "Unknown")
    log "VMware Tools detected: $VMWARE_VERSION"
else
    warn "VMware Tools not detected. Installing open-vm-tools..."
    sudo apt update
    sudo apt install -y open-vm-tools
fi

# Check system resources
log "Checking system resources..."
CPU_CORES=$(nproc)
MEMORY_GB=$(awk '/MemTotal/ {printf "%.1f", $2/1024/1024}' /proc/meminfo)
DISK_GB=$(df -BG / | awk 'NR==2 {print $2}' | sed 's/G//')

log "CPU Cores: $CPU_CORES"
log "Memory: ${MEMORY_GB}GB"
log "Disk Space: ${DISK_GB}GB"

# Validate minimum requirements
if [[ $CPU_CORES -lt 2 ]]; then
    warn "CPU cores ($CPU_CORES) below recommended minimum (4)"
fi

if (( $(echo "$MEMORY_GB < 4" | bc -l) )); then
    warn "Memory (${MEMORY_GB}GB) below recommended minimum (8GB)"
fi

if [[ $DISK_GB -lt 30 ]]; then
    error "Insufficient disk space (${DISK_GB}GB). Minimum 50GB required."
fi

# Update system packages
log "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install essential dependencies
log "Installing essential dependencies..."
sudo apt install -y \
    curl \
    wget \
    git \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    build-essential \
    python3 \
    python3-pip \
    htop \
    iotop \
    net-tools \
    ufw \
    fail2ban \
    nginx \
    postgresql-client \
    bc

# Install Node.js 20
log "Installing Node.js 20..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    NODE_VERSION=$(node --version)
    log "Node.js already installed: $NODE_VERSION"
fi

# Verify Node.js installation
NODE_VERSION=$(node --version | sed 's/v//')
NPM_VERSION=$(npm --version)
log "Node.js: $NODE_VERSION"
log "npm: $NPM_VERSION"

# Create application directory
log "Setting up application directory..."
sudo mkdir -p /opt/ai-agent-system
sudo chown $USER:$USER /opt/ai-agent-system

# Clone or copy AI Agent repository
log "Setting up AI Agent System..."
if [[ -d "/home/runner/workspace/ai-agent-repo" ]]; then
    log "Copying local repository..."
    cp -r /home/runner/workspace/ai-agent-repo/* /opt/ai-agent-system/
else
    log "Repository not found locally. Please manually copy the AI Agent system files to /opt/ai-agent-system/"
    warn "Or provide a Git repository URL to clone from"
fi

# Install application dependencies
if [[ -f "/opt/ai-agent-system/package.json" ]]; then
    log "Installing application dependencies..."
    cd /opt/ai-agent-system
    npm install --production
else
    warn "package.json not found. Please ensure AI Agent files are copied correctly."
fi

# Configure environment
log "Configuring environment..."
if [[ ! -f "/opt/ai-agent-system/.env" ]]; then
    cat > /opt/ai-agent-system/.env << EOF
# AI Agent System Environment Configuration
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Database Configuration (Update with your PostgreSQL details)
DATABASE_URL=postgresql://aiagent:SecureDBPass123!@localhost:5432/aiagent

# Security Configuration
JWT_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)

# AI Configuration
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here

# Security Framework
ENABLE_SECURITY_FRAMEWORK=true
ENABLE_AUTONOMOUS_REPAIR=true
ENABLE_LEARNING_ENGINE=true
EOF
    log "Environment file created at /opt/ai-agent-system/.env"
    warn "Please update the .env file with your actual API keys and database settings"
fi

# Setup PostgreSQL (optional)
read -p "Do you want to install and configure PostgreSQL locally? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log "Installing PostgreSQL..."
    sudo apt install -y postgresql postgresql-contrib
    
    log "Configuring PostgreSQL..."
    sudo -u postgres psql << EOF
CREATE DATABASE aiagent;
CREATE USER aiagent WITH PASSWORD 'SecureDBPass123!';
GRANT ALL PRIVILEGES ON DATABASE aiagent TO aiagent;
ALTER USER aiagent CREATEDB;
\q
EOF
    
    log "PostgreSQL configured successfully"
fi

# Configure firewall
log "Configuring firewall..."
sudo ufw --force enable
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 5000/tcp  # AI Agent
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS

# Configure fail2ban
log "Configuring fail2ban..."
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Create systemd service
log "Creating systemd service..."
sudo tee /etc/systemd/system/ai-agent.service > /dev/null << EOF
[Unit]
Description=AI Agent System
Documentation=https://github.com/ai-agent-system
After=network.target postgresql.service

[Service]
Type=simple
User=$USER
Group=$USER
WorkingDirectory=/opt/ai-agent-system
ExecStart=/usr/bin/npm start
ExecReload=/bin/kill -s HUP \$MAINPID
KillMode=mixed
KillSignal=SIGINT
TimeoutStopSec=5
PrivateTmp=true
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=ai-agent

# Security settings
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/ai-agent-system
PrivateDevices=true
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true

# Environment
Environment=NODE_ENV=production
Environment=PORT=5000
EnvironmentFile=/opt/ai-agent-system/.env

[Install]
WantedBy=multi-user.target
EOF

# Enable and configure service
log "Enabling AI Agent service..."
sudo systemctl daemon-reload
sudo systemctl enable ai-agent

# Configure nginx reverse proxy
log "Configuring nginx reverse proxy..."
sudo tee /etc/nginx/sites-available/ai-agent > /dev/null << EOF
server {
    listen 80;
    server_name _;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Main application
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # WebSocket support
    location /ws {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable nginx site
sudo ln -sf /etc/nginx/sites-available/ai-agent /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# Optimize system for AI workloads
log "Optimizing system for AI workloads..."
sudo tee -a /etc/sysctl.conf > /dev/null << EOF

# AI Agent System Optimizations
vm.swappiness=1
net.core.rmem_max=134217728
net.core.wmem_max=134217728
net.ipv4.tcp_rmem=4096 65536 134217728
net.ipv4.tcp_wmem=4096 65536 134217728
net.core.netdev_max_backlog=5000
EOF

sudo sysctl -p

# Create backup script
log "Creating backup script..."
sudo tee /opt/backup-ai-agent.sh > /dev/null << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database if PostgreSQL is running
if systemctl is-active --quiet postgresql; then
    pg_dump -h localhost -U aiagent aiagent > $BACKUP_DIR/aiagent_$DATE.sql
fi

# Backup application files
tar -czf $BACKUP_DIR/aiagent_files_$DATE.tar.gz /opt/ai-agent-system --exclude=node_modules

# Cleanup old backups (keep 7 days)
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

sudo chmod +x /opt/backup-ai-agent.sh

# Create cron job for backups
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/backup-ai-agent.sh") | crontab -

# Performance monitoring setup
log "Setting up performance monitoring..."
sudo tee /opt/monitor-ai-agent.sh > /dev/null << 'EOF'
#!/bin/bash
LOG_FILE="/var/log/ai-agent-monitor.log"

echo "$(date): AI Agent System Monitoring" >> $LOG_FILE
echo "CPU Usage: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)" >> $LOG_FILE
echo "Memory Usage: $(free | grep Mem | awk '{printf("%.2f%%", $3/$2 * 100.0)}')" >> $LOG_FILE
echo "Disk Usage: $(df -h / | awk 'NR==2{print $5}')" >> $LOG_FILE
echo "Service Status: $(systemctl is-active ai-agent)" >> $LOG_FILE
echo "---" >> $LOG_FILE
EOF

sudo chmod +x /opt/monitor-ai-agent.sh
(crontab -l 2>/dev/null; echo "*/15 * * * * /opt/monitor-ai-agent.sh") | crontab -

# Create deployment info file
log "Creating deployment information file..."
tee /opt/ai-agent-system/DEPLOYMENT_INFO.md > /dev/null << EOF
# AI Agent System - VMware Deployment Information

## Deployment Details
- **Date**: $(date)
- **System**: $OS $VERSION ($ARCH)
- **VMware Tools**: $VMWARE_VERSION
- **Resources**: ${CPU_CORES} CPU, ${MEMORY_GB}GB RAM, ${DISK_GB}GB Disk

## Service Information
- **Service Name**: ai-agent
- **Port**: 5000
- **Protocol**: HTTP/WebSocket
- **Reverse Proxy**: nginx (port 80)

## File Locations
- **Application**: /opt/ai-agent-system/
- **Configuration**: /opt/ai-agent-system/.env
- **Service File**: /etc/systemd/system/ai-agent.service
- **Nginx Config**: /etc/nginx/sites-available/ai-agent
- **Logs**: journalctl -u ai-agent

## Management Commands
\`\`\`bash
# Service management
sudo systemctl start ai-agent
sudo systemctl stop ai-agent
sudo systemctl restart ai-agent
sudo systemctl status ai-agent

# View logs
sudo journalctl -u ai-agent -f

# Backup system
sudo /opt/backup-ai-agent.sh

# Monitor performance
sudo /opt/monitor-ai-agent.sh
\`\`\`

## Security
- **Firewall**: UFW enabled with restricted ports
- **Fail2ban**: Enabled for SSH protection
- **SSL**: Configure with Let's Encrypt for production use

## Next Steps
1. Update .env file with your API keys
2. Configure SSL certificate for HTTPS
3. Start the AI Agent service
4. Access the system via http://your-vm-ip
EOF

# Final instructions
log "Deployment completed successfully!"
echo
echo "=============================================="
echo "🎉 AI Agent System VMware Deployment Complete!"
echo "=============================================="
echo
echo "📋 Next Steps:"
echo "1. Update /opt/ai-agent-system/.env with your API keys"
echo "2. Start the service: sudo systemctl start ai-agent"
echo "3. Check status: sudo systemctl status ai-agent"
echo "4. Access via: http://$(hostname -I | awk '{print $1}')"
echo
echo "📁 Important Files:"
echo "- Configuration: /opt/ai-agent-system/.env"
echo "- Service: /etc/systemd/system/ai-agent.service"
echo "- Logs: journalctl -u ai-agent"
echo
echo "🔒 Security:"
echo "- Firewall: Enabled (ports 22, 80, 443, 5000)"
echo "- Fail2ban: Enabled"
echo "- Configure SSL for production use"
echo
echo "📊 Monitoring:"
echo "- Performance: /opt/monitor-ai-agent.sh"
echo "- Backups: /opt/backup-ai-agent.sh (daily at 2 AM)"
echo
echo "For detailed documentation, see:"
echo "/opt/ai-agent-system/DEPLOYMENT_INFO.md"
echo
log "VMware deployment script completed successfully!"