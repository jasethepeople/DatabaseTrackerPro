# AI Agent System - VMware Deployment Guide

## Overview
This guide provides step-by-step instructions for deploying the AI Agent System on VMware infrastructure, including VMware Workstation, vSphere, and ESXi environments.

## System Requirements

### Minimum VM Specifications
- **CPU**: 4 vCPUs (8 recommended for optimal performance)
- **RAM**: 8GB (16GB recommended)
- **Storage**: 50GB SSD (100GB recommended)
- **Network**: 1 NIC with internet connectivity
- **OS**: Ubuntu 22.04 LTS or Windows Server 2022

### Recommended VM Specifications
- **CPU**: 8 vCPUs with hardware acceleration
- **RAM**: 16GB
- **Storage**: 100GB NVMe SSD
- **Network**: 2 NICs (management + production)
- **OS**: Ubuntu 22.04 LTS

## Deployment Options

### Option 1: Ubuntu Linux VM (Recommended)
Best performance and resource efficiency for the AI Agent system.

### Option 2: Windows Server VM
Full compatibility with Windows-based security tools and enterprise environments.

### Option 3: Container-based VM
Docker-optimized VM for microservices deployment.

## Pre-Deployment Setup

### 1. VMware Environment Preparation
```bash
# Ensure VMware Tools is installed
# Enable hardware acceleration for AI workloads
# Configure VM network settings
# Allocate sufficient resources
```

### 2. Network Configuration
- **Management Network**: 192.168.1.0/24
- **Production Network**: 10.0.0.0/24
- **Required Ports**: 5000 (HTTP), 443 (HTTPS), 22 (SSH)

## Deployment Methods

### Method 1: Direct VM Deployment
1. Create new VM with recommended specifications
2. Install Ubuntu 22.04 LTS
3. Clone AI Agent repository
4. Run automated setup script

### Method 2: OVA Template Deployment
1. Import pre-configured OVA template
2. Customize VM settings
3. Power on and configure network
4. Access AI Agent interface

### Method 3: Infrastructure as Code
1. Use Terraform for automated VM provisioning
2. Apply Ansible playbooks for configuration
3. Deploy AI Agent via automated pipeline

## Step-by-Step Deployment

### Step 1: VM Creation
```bash
# VMware Workstation
# 1. File > New Virtual Machine
# 2. Select "Typical" configuration
# 3. Choose Ubuntu 22.04 LTS ISO
# 4. Configure VM specs as recommended above
# 5. Finish VM creation
```

### Step 2: OS Installation
```bash
# Boot from Ubuntu ISO
# Select "Install Ubuntu Server"
# Configure network with static IP
# Create admin user: aiagent/SecureP@ss123!
# Enable SSH server
# Install security updates
```

### Step 3: System Preparation
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install required dependencies
sudo apt install -y curl git nodejs npm postgresql-client

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installations
node --version
npm --version
```

### Step 4: AI Agent Deployment
```bash
# Clone repository
git clone [ai-agent-repo-url] /opt/ai-agent-system
cd /opt/ai-agent-system

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database and security settings

# Setup database
npm run db:push

# Start services
npm run dev
```

### Step 5: Service Configuration
```bash
# Create systemd service
sudo nano /etc/systemd/system/ai-agent.service

[Unit]
Description=AI Agent System
After=network.target

[Service]
Type=simple
User=aiagent
WorkingDirectory=/opt/ai-agent-system
ExecStart=/usr/bin/npm run start
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=5000

[Install]
WantedBy=multi-user.target

# Enable and start service
sudo systemctl enable ai-agent
sudo systemctl start ai-agent
sudo systemctl status ai-agent
```

## Security Configuration

### Firewall Setup
```bash
# Configure UFW firewall
sudo ufw enable
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 5000/tcp # AI Agent
sudo ufw allow 443/tcp  # HTTPS
sudo ufw status
```

### SSL Certificate
```bash
# Install Let's Encrypt certbot
sudo apt install -y certbot

# Generate SSL certificate
sudo certbot certonly --standalone -d your-domain.com

# Configure nginx reverse proxy
sudo apt install -y nginx
# Configure nginx with SSL termination
```

### Database Security
```bash
# If using local PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Secure PostgreSQL installation
sudo -u postgres psql
CREATE DATABASE aiagent;
CREATE USER aiagent WITH PASSWORD 'SecureDBPass123!';
GRANT ALL PRIVILEGES ON DATABASE aiagent TO aiagent;
\q

# Update connection string in .env
DATABASE_URL="postgresql://aiagent:SecureDBPass123!@localhost:5432/aiagent"
```

## VMware-Specific Optimizations

### VM Settings
```bash
# Enable hardware acceleration
# Configure memory reservations
# Enable CPU performance counters
# Optimize disk I/O with paravirtual SCSI
# Use VMXNET3 network adapter
```

### Performance Tuning
```bash
# Disable swap for better performance
sudo swapoff -a
sudo sed -i '/ swap / s/^\(.*\)$/#\1/g' /etc/fstab

# Optimize kernel parameters
echo 'vm.swappiness=1' | sudo tee -a /etc/sysctl.conf
echo 'net.core.rmem_max = 134217728' | sudo tee -a /etc/sysctl.conf
echo 'net.core.wmem_max = 134217728' | sudo tee -a /etc/sysctl.conf

# Apply settings
sudo sysctl -p
```

### Monitoring Integration
```bash
# Install VMware Tools
sudo apt install -y open-vm-tools

# Configure resource monitoring
# Set up alerts for CPU, memory, and disk usage
# Enable SNMP monitoring if required
```

## Backup and Recovery

### VM Snapshot Strategy
1. **Initial Snapshot**: After OS installation
2. **Pre-deployment Snapshot**: Before AI Agent installation
3. **Production Snapshot**: After successful deployment
4. **Regular Snapshots**: Daily/weekly as per policy

### Data Backup
```bash
# Database backup script
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
pg_dump -h localhost -U aiagent aiagent > $BACKUP_DIR/aiagent_$DATE.sql

# Backup application files
tar -czf $BACKUP_DIR/aiagent_files_$DATE.tar.gz /opt/ai-agent-system

# Cleanup old backups (keep 7 days)
find $BACKUP_DIR -type f -mtime +7 -delete
```

## Troubleshooting

### Common Issues
1. **Port conflicts**: Check if port 5000 is available
2. **Database connection**: Verify PostgreSQL service status
3. **Node.js version**: Ensure Node.js 20+ is installed
4. **Memory issues**: Increase VM RAM allocation
5. **Network connectivity**: Verify firewall rules

### Diagnostic Commands
```bash
# Check service status
sudo systemctl status ai-agent

# View logs
sudo journalctl -u ai-agent -f

# Check ports
sudo netstat -tlnp | grep 5000

# Monitor resources
htop
iotop
```

## Scaling Considerations

### Horizontal Scaling
- Deploy multiple VMs behind load balancer
- Use shared PostgreSQL database
- Configure session clustering

### Vertical Scaling
- Increase VM resources (CPU, RAM)
- Optimize database performance
- Enable CPU/memory reservations

## Security Best Practices

### VM Hardening
1. Disable unnecessary services
2. Configure strong passwords
3. Enable automatic security updates
4. Implement network segmentation
5. Regular security audits

### Application Security
1. Use HTTPS with valid certificates
2. Implement proper authentication
3. Regular dependency updates
4. Monitor for vulnerabilities
5. Backup encryption

## Maintenance

### Regular Tasks
- **Daily**: Monitor system health and logs
- **Weekly**: Apply security updates
- **Monthly**: Review resource usage and performance
- **Quarterly**: Security audit and penetration testing

### Update Procedure
1. Create VM snapshot
2. Test updates in staging environment
3. Schedule maintenance window
4. Apply updates
5. Verify functionality
6. Remove old snapshots

## Support and Documentation

### Log Locations
- Application logs: `/opt/ai-agent-system/logs/`
- System logs: `/var/log/syslog`
- Service logs: `journalctl -u ai-agent`

### Configuration Files
- Main config: `/opt/ai-agent-system/.env`
- Service config: `/etc/systemd/system/ai-agent.service`
- Nginx config: `/etc/nginx/sites-available/ai-agent`

This deployment guide ensures a secure, scalable, and maintainable AI Agent System deployment on VMware infrastructure.