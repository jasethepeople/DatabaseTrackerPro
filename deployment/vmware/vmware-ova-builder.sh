#!/bin/bash
set -e

# AI Agent System - VMware OVA Builder Script
# Creates a deployable OVA template for VMware environments

echo "📦 AI Agent System - VMware OVA Builder"
echo "======================================="

# Configuration
VM_NAME="AI-Agent-System"
VM_VERSION="1.0.0"
OUTPUT_DIR="/tmp/ova-build"
OVA_NAME="${VM_NAME}-v${VM_VERSION}.ova"

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Check dependencies
log "Checking dependencies..."
command -v ovftool >/dev/null 2>&1 || error "ovftool not found. Please install VMware OVF Tool."
command -v qemu-img >/dev/null 2>&1 || warn "qemu-img not found. Some features may be limited."

# Create output directory
log "Creating output directory..."
mkdir -p "$OUTPUT_DIR"
cd "$OUTPUT_DIR"

# Create OVF descriptor
log "Creating OVF descriptor..."
cat > "${VM_NAME}.ovf" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<Envelope vmw:buildId="build-23925044" 
          xmlns="http://schemas.dmtf.org/ovf/envelope/1" 
          xmlns:cim="http://schemas.dmtf.org/wbem/wscim/1/common" 
          xmlns:ovf="http://schemas.dmtf.org/ovf/envelope/1" 
          xmlns:rasd="http://schemas.dmtf.org/wbem/wscim/1/cim-schema/2/CIM_ResourceAllocationSettingData" 
          xmlns:vmw="http://www.vmware.com/schema/ovf" 
          xmlns:vssd="http://schemas.dmtf.org/wbem/wscim/1/cim-schema/2/CIM_VirtualSystemSettingData" 
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  
  <References>
    <File ovf:href="${VM_NAME}-disk1.vmdk" ovf:id="file1" ovf:size="8589934592"/>
  </References>
  
  <DiskSection>
    <Info>Virtual disk information</Info>
    <Disk ovf:capacity="85899345920" ovf:capacityAllocationUnits="byte" 
          ovf:diskId="vmdisk1" ovf:fileRef="file1" 
          ovf:format="http://www.vmware.com/interfaces/specifications/vmdk.html#streamOptimized" 
          ovf:populatedSize="4294967296"/>
  </DiskSection>
  
  <NetworkSection>
    <Info>Logical networks</Info>
    <Network ovf:name="VM Network">
      <Description>The VM Network network</Description>
    </Network>
  </NetworkSection>
  
  <VirtualSystem ovf:id="${VM_NAME}">
    <Info>AI Agent System - Autonomous Development Environment</Info>
    <Name>${VM_NAME}</Name>
    <AnnotationSection>
      <Info>Human-readable description</Info>
      <Annotation>
        AI Agent System v${VM_VERSION}
        
        Advanced autonomous development environment featuring:
        - AI Coding Assistant with intelligent suggestions
        - Autonomous self-repair system
        - Real-world automation capabilities
        - Advanced security framework
        - Multi-platform deployment support
        
        Default Credentials:
        - SSH: aiagent / SecureP@ss123!
        - Web UI: admin / password
        - Database: aiagent / SecureDBPass123!
        
        Access: http://[VM-IP]:5000
        
        Documentation: /opt/ai-agent-system/README.md
      </Annotation>
    </AnnotationSection>
    
    <OperatingSystemSection ovf:id="107" vmw:osType="ubuntu64Guest">
      <Info>Operating system</Info>
      <Description>Ubuntu Linux (64-bit)</Description>
    </OperatingSystemSection>
    
    <VirtualHardwareSection>
      <Info>Virtual hardware requirements</Info>
      <System>
        <vssd:ElementName>Virtual Hardware Family</vssd:ElementName>
        <vssd:InstanceID>0</vssd:InstanceID>
        <vssd:VirtualSystemIdentifier>${VM_NAME}</vssd:VirtualSystemIdentifier>
        <vssd:VirtualSystemType>vmx-19</vssd:VirtualSystemType>
      </System>
      
      <!-- CPU -->
      <Item>
        <rasd:AllocationUnits>hertz * 10^6</rasd:AllocationUnits>
        <rasd:Description>Number of Virtual CPUs</rasd:Description>
        <rasd:ElementName>4 virtual CPU(s)</rasd:ElementName>
        <rasd:InstanceID>1</rasd:InstanceID>
        <rasd:ResourceType>3</rasd:ResourceType>
        <rasd:VirtualQuantity>4</rasd:VirtualQuantity>
        <vmw:CoresPerSocket ovf:required="false">2</vmw:CoresPerSocket>
      </Item>
      
      <!-- Memory -->
      <Item>
        <rasd:AllocationUnits>byte * 2^20</rasd:AllocationUnits>
        <rasd:Description>Memory Size</rasd:Description>
        <rasd:ElementName>8192MB of memory</rasd:ElementName>
        <rasd:InstanceID>2</rasd:InstanceID>
        <rasd:ResourceType>4</rasd:ResourceType>
        <rasd:VirtualQuantity>8192</rasd:VirtualQuantity>
      </Item>
      
      <!-- SCSI Controller -->
      <Item>
        <rasd:Address>0</rasd:Address>
        <rasd:Description>SCSI Controller</rasd:Description>
        <rasd:ElementName>SCSI Controller 0</rasd:ElementName>
        <rasd:InstanceID>3</rasd:InstanceID>
        <rasd:ResourceSubType>lsilogic</rasd:ResourceSubType>
        <rasd:ResourceType>6</rasd:ResourceType>
      </Item>
      
      <!-- Hard Disk -->
      <Item>
        <rasd:AddressOnParent>0</rasd:AddressOnParent>
        <rasd:Description>Hard disk</rasd:Description>
        <rasd:ElementName>Hard disk 1</rasd:ElementName>
        <rasd:HostResource>ovf:/disk/vmdisk1</rasd:HostResource>
        <rasd:InstanceID>4</rasd:InstanceID>
        <rasd:Parent>3</rasd:Parent>
        <rasd:ResourceType>17</rasd:ResourceType>
      </Item>
      
      <!-- Network Adapter -->
      <Item>
        <rasd:AddressOnParent>7</rasd:AddressOnParent>
        <rasd:AutomaticAllocation>true</rasd:AutomaticAllocation>
        <rasd:Connection>VM Network</rasd:Connection>
        <rasd:Description>E1000e ethernet adapter</rasd:Description>
        <rasd:ElementName>Network adapter 1</rasd:ElementName>
        <rasd:InstanceID>5</rasd:InstanceID>
        <rasd:ResourceSubType>E1000e</rasd:ResourceSubType>
        <rasd:ResourceType>10</rasd:ResourceType>
      </Item>
      
      <!-- Video Card -->
      <Item>
        <rasd:AutomaticAllocation>false</rasd:AutomaticAllocation>
        <rasd:Description>Video card</rasd:Description>
        <rasd:ElementName>Video card</rasd:ElementName>
        <rasd:InstanceID>6</rasd:InstanceID>
        <rasd:ResourceType>24</rasd:ResourceType>
        <rasd:VirtualQuantity>1</rasd:VirtualQuantity>
        <vmw:Config ovf:required="false" vmw:key="enable3DSupport" vmw:value="false"/>
        <vmw:Config ovf:required="false" vmw:key="graphicsMemorySizeInKB" vmw:value="262144"/>
      </Item>
    </VirtualHardwareSection>
    
    <!-- Product Information -->
    <ProductSection>
      <Info>Product Information</Info>
      <Product>AI Agent System</Product>
      <Vendor>AI Development Team</Vendor>
      <Version>${VM_VERSION}</Version>
      <ProductUrl>https://github.com/ai-agent-system</ProductUrl>
      <VendorUrl>https://github.com/ai-agent-system</VendorUrl>
    </ProductSection>
    
    <!-- Application Properties -->
    <vmw:ApplicationProperties>
      <vmw:Application ovf:required="false">
        <vmw:Class>ai-agent</vmw:Class>
        <vmw:Property ovf:key="network.ip" ovf:type="string">
          <vmw:Label>IP Address</vmw:Label>
          <vmw:Description>Static IP address for the VM (leave empty for DHCP)</vmw:Description>
        </vmw:Property>
        <vmw:Property ovf:key="network.netmask" ovf:type="string" ovf:value="255.255.255.0">
          <vmw:Label>Netmask</vmw:Label>
          <vmw:Description>Network subnet mask</vmw:Description>
        </vmw:Property>
        <vmw:Property ovf:key="network.gateway" ovf:type="string">
          <vmw:Label>Gateway</vmw:Label>
          <vmw:Description>Default gateway</vmw:Description>
        </vmw:Property>
        <vmw:Property ovf:key="network.dns" ovf:type="string" ovf:value="8.8.8.8">
          <vmw:Label>DNS Server</vmw:Label>
          <vmw:Description>Primary DNS server</vmw:Description>
        </vmw:Property>
        <vmw:Property ovf:key="aiagent.admin_password" ovf:type="password">
          <vmw:Label>Admin Password</vmw:Label>
          <vmw:Description>Password for the admin user</vmw:Description>
        </vmw:Property>
        <vmw:Property ovf:key="aiagent.enable_ssl" ovf:type="boolean" ovf:value="false">
          <vmw:Label>Enable SSL</vmw:Label>
          <vmw:Description>Enable HTTPS with self-signed certificate</vmw:Description>
        </vmw:Property>
      </vmw:Application>
    </vmw:ApplicationProperties>
  </VirtualSystem>
</Envelope>
EOF

# Create manifest file
log "Creating manifest file..."
cat > "${VM_NAME}.mf" << EOF
SHA256(${VM_NAME}.ovf)= $(sha256sum "${VM_NAME}.ovf" | cut -d' ' -f1)
SHA256(${VM_NAME}-disk1.vmdk)= placeholder_will_be_replaced_after_disk_creation
EOF

# Create deployment instructions
log "Creating deployment instructions..."
cat > "DEPLOYMENT_INSTRUCTIONS.txt" << EOF
AI Agent System - VMware OVA Deployment Instructions
==================================================

SYSTEM REQUIREMENTS:
- VMware vSphere 6.7+ or VMware Workstation 15+
- 4 vCPUs, 8GB RAM, 80GB storage minimum
- Network connectivity for AI Agent access

DEPLOYMENT STEPS:

1. IMPORT OVA:
   - Open VMware vSphere Client or VMware Workstation
   - File > Deploy OVF Template / Import Virtual Machine
   - Select ${OVA_NAME}
   - Follow the import wizard

2. CUSTOMIZE SETTINGS (during import):
   - VM Name: AI-Agent-System
   - Resource Pool: Select appropriate pool
   - Storage: Select datastore with sufficient space
   - Network: Map to appropriate network

3. CONFIGURE PROPERTIES:
   - IP Address: Set static IP or leave empty for DHCP
   - Netmask: Usually 255.255.255.0
   - Gateway: Your network gateway
   - DNS Server: Your DNS server (default: 8.8.8.8)
   - Admin Password: Set secure password for admin user
   - Enable SSL: Check if you want HTTPS enabled

4. POWER ON:
   - Start the virtual machine
   - Wait for boot process to complete (~2-3 minutes)
   - Check console for any boot messages

5. ACCESS AI AGENT:
   - Web Interface: http://[VM-IP]:5000
   - SSH Access: ssh aiagent@[VM-IP]
   - Default Web Login: admin / [password you set]

FIRST-TIME SETUP:
1. Access web interface
2. Complete initial configuration wizard
3. Add API keys for AI services (OpenAI, Anthropic)
4. Configure backup settings
5. Test AI Coding Assistant functionality

TROUBLESHOOTING:
- Check VM console for boot errors
- Verify network connectivity
- Ensure VM has sufficient resources
- Check firewall settings on host network

SECURITY NOTES:
- Change default passwords immediately
- Configure SSL certificate for production use
- Regular security updates recommended
- Monitor system logs for anomalies

SUPPORT:
- Documentation: /opt/ai-agent-system/README.md
- Logs: sudo journalctl -u ai-agent
- Service: sudo systemctl status ai-agent

For detailed documentation and troubleshooting, see the included
VMware-Deployment-Guide.md file.
EOF

# Create disk placeholder (in real scenario, you'd have the actual VMDK)
log "Creating disk placeholder..."
cat > "CREATE_DISK_INSTRUCTIONS.txt" << EOF
DISK CREATION INSTRUCTIONS:
===========================

To complete the OVA package, you need to create the actual VMDK disk file.

OPTION 1 - From existing VM:
1. Shut down your AI Agent VM
2. Locate the VMDK file (usually in VM folder)
3. Copy to this directory as: ${VM_NAME}-disk1.vmdk
4. Update manifest file with actual SHA256 hash

OPTION 2 - From Ubuntu ISO:
1. Create new VM with Ubuntu 22.04 LTS
2. Follow vmware-setup.sh script to install AI Agent
3. Shut down VM and export VMDK
4. Copy VMDK file to this directory

OPTION 3 - Use qemu-img to convert:
1. If you have RAW or other format disk image:
   qemu-img convert -f raw -O vmdk source.img ${VM_NAME}-disk1.vmdk

FINALIZE OVA:
1. Update manifest file with correct SHA256:
   SHA256(${VM_NAME}-disk1.vmdk)= \$(sha256sum ${VM_NAME}-disk1.vmdk | cut -d' ' -f1)
2. Create OVA package:
   tar -cf ${OVA_NAME} ${VM_NAME}.ovf ${VM_NAME}.mf ${VM_NAME}-disk1.vmdk

SIZE OPTIMIZATION:
- Use vmware-vdiskmanager to shrink disk:
  vmware-vdiskmanager -k ${VM_NAME}-disk1.vmdk
- Enable compression in OVA creation
- Remove unnecessary files before creating disk image
EOF

# Create validation script
log "Creating OVA validation script..."
cat > "validate-ova.sh" << 'EOF'
#!/bin/bash

OVA_FILE="${VM_NAME}-v${VM_VERSION}.ova"

echo "Validating OVA package: $OVA_FILE"

if [[ ! -f "$OVA_FILE" ]]; then
    echo "ERROR: OVA file not found!"
    exit 1
fi

# Extract and validate contents
echo "Extracting OVA contents..."
mkdir -p ova-validate
cd ova-validate
tar -tf "../$OVA_FILE"

echo "Validating OVF descriptor..."
if command -v ovftool >/dev/null 2>&1; then
    ovftool --schemaValidate "../$OVA_FILE"
    echo "OVF validation completed"
else
    echo "WARNING: ovftool not found, skipping validation"
fi

echo "Checking file integrity..."
tar -xf "../$OVA_FILE"
if [[ -f "${VM_NAME}.mf" ]]; then
    echo "Verifying checksums..."
    sha256sum -c "${VM_NAME}.mf" || echo "WARNING: Checksum verification failed"
fi

cd ..
rm -rf ova-validate

echo "OVA validation completed"
EOF

chmod +x "validate-ova.sh"

# Create build completion script
log "Creating build completion script..."
cat > "complete-build.sh" << EOF
#!/bin/bash
set -e

echo "Completing OVA build for AI Agent System..."

# Check if VMDK exists
if [[ ! -f "${VM_NAME}-disk1.vmdk" ]]; then
    echo "ERROR: ${VM_NAME}-disk1.vmdk not found!"
    echo "Please follow instructions in CREATE_DISK_INSTRUCTIONS.txt"
    exit 1
fi

echo "Updating manifest with actual disk hash..."
DISK_HASH=\$(sha256sum "${VM_NAME}-disk1.vmdk" | cut -d' ' -f1)
sed -i "s/placeholder_will_be_replaced_after_disk_creation/\$DISK_HASH/" "${VM_NAME}.mf"

echo "Creating OVA package..."
tar -cf "${OVA_NAME}" "${VM_NAME}.ovf" "${VM_NAME}.mf" "${VM_NAME}-disk1.vmdk"

echo "Validating OVA..."
./validate-ova.sh

echo "OVA build completed successfully!"
echo "Output file: ${OVA_NAME}"
echo "Size: \$(du -h "${OVA_NAME}" | cut -f1)"

echo ""
echo "To deploy:"
echo "1. Copy ${OVA_NAME} to your VMware environment"
echo "2. Follow instructions in DEPLOYMENT_INSTRUCTIONS.txt"
echo "3. Import via VMware vSphere Client or Workstation"
EOF

chmod +x "complete-build.sh"

# Summary
log "OVA builder setup completed!"
echo
echo "============================================"
echo "📦 VMware OVA Builder Setup Complete"
echo "============================================"
echo
echo "📁 Output directory: $OUTPUT_DIR"
echo "📄 Files created:"
echo "  - ${VM_NAME}.ovf (OVF descriptor)"
echo "  - ${VM_NAME}.mf (manifest file)"
echo "  - DEPLOYMENT_INSTRUCTIONS.txt"
echo "  - CREATE_DISK_INSTRUCTIONS.txt"
echo "  - validate-ova.sh"
echo "  - complete-build.sh"
echo
echo "📋 Next Steps:"
echo "1. Create or obtain VMDK disk file (see CREATE_DISK_INSTRUCTIONS.txt)"
echo "2. Run: ./complete-build.sh"
echo "3. Deploy ${OVA_NAME} to VMware environment"
echo
echo "📊 Expected OVA specifications:"
echo "  - OS: Ubuntu 22.04 LTS"
echo "  - CPU: 4 vCPUs"
echo "  - RAM: 8GB"
echo "  - Disk: 80GB"
echo "  - Network: E1000e adapter"
echo
echo "For detailed deployment instructions, see:"
echo "DEPLOYMENT_INSTRUCTIONS.txt"