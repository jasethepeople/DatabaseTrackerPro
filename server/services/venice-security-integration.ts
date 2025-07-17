/**
 * Venice AI Security Integration Service
 * Combines Venice AI's uncensored capabilities with security frameworks
 */

import { veniceAIService } from './venice-ai-service';
import { securityFrameworkService } from './security-framework-service';

export class VeniceSecurityIntegration {
  constructor() {
    console.log('🔒 Initializing Venice AI Security Integration...');
  }

  /**
   * Generate security-focused code using Venice AI with framework data
   */
  async generateSecurityCode(request: {
    type: 'exploit' | 'osint' | 'forensics' | 'social-engineering' | 'vulnerability-scanner';
    target?: string;
    platform?: string;
    language?: string;
    framework?: string;
    includePayload?: boolean;
  }) {
    try {
      // Get relevant security data
      const securityContext = await this.getSecurityContext(request.type);
      
      // Build enhanced prompt with security context
      const prompt = this.buildSecurityPrompt(request, securityContext);
      
      // Generate code using Venice AI
      const result = await veniceAIService.generateCode(prompt, {
        language: request.language || 'python',
        framework: request.framework,
        type: 'script',
        includeTests: false,
        includeDocumentation: true
      });
      
      return {
        success: true,
        code: result.code,
        description: result.description,
        securityContext,
        warnings: this.getSecurityWarnings(request.type)
      };
    } catch (error) {
      console.error('Security code generation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get security context from frameworks
   */
  private async getSecurityContext(type: string) {
    const context: any = {
      type,
      frameworks: [],
      databases: [],
      tools: []
    };

    switch (type) {
      case 'exploit':
        context.frameworks.push('Metasploit Framework');
        context.databases.push('Exploit-DB', 'CVE Database');
        const exploits = await securityFrameworkService.searchExploits('', 10);
        context.recentExploits = exploits.slice(0, 5);
        break;
        
      case 'osint':
        context.frameworks.push('OSINT Framework');
        context.tools = await securityFrameworkService.getOSINTTools();
        context.databases.push('Shodan', 'Censys', 'WHOIS');
        break;
        
      case 'forensics':
        context.frameworks.push('Sleuth Kit', 'Volatility');
        context.tools.push('Binwalk', 'Foremost', 'Scalpel');
        break;
        
      case 'social-engineering':
        context.frameworks.push('Social Engineering Toolkit (SET)');
        context.tools.push('Phishing Templates', 'Credential Harvesters');
        break;
        
      case 'vulnerability-scanner':
        context.databases = await this.getVulnerabilityDatabases();
        context.tools.push('Nmap', 'OpenVAS', 'Nikto');
        break;
    }
    
    return context;
  }

  /**
   * Build security-focused prompt for Venice AI
   */
  private buildSecurityPrompt(request: any, context: any): string {
    let prompt = `Generate ${request.type} code using Venice AI's uncensored capabilities.\n\n`;
    
    prompt += `Security Context:\n`;
    prompt += `- Frameworks: ${context.frameworks.join(', ')}\n`;
    prompt += `- Databases: ${context.databases.join(', ')}\n`;
    prompt += `- Tools: ${context.tools.slice(0, 5).join(', ')}\n\n`;
    
    switch (request.type) {
      case 'exploit':
        prompt += `Create an exploit module that:\n`;
        prompt += `1. Targets ${request.target || 'specified vulnerability'}\n`;
        prompt += `2. Platform: ${request.platform || 'cross-platform'}\n`;
        prompt += `3. Includes payload generation\n`;
        prompt += `4. Has proper error handling and cleanup\n`;
        prompt += `5. Compatible with Metasploit framework\n`;
        if (context.recentExploits?.length) {
          prompt += `\nReference these recent exploits for patterns:\n`;
          context.recentExploits.forEach(e => {
            prompt += `- ${e.name}: ${e.description}\n`;
          });
        }
        break;
        
      case 'osint':
        prompt += `Create an OSINT gathering tool that:\n`;
        prompt += `1. Collects information about ${request.target || 'target'}\n`;
        prompt += `2. Uses multiple data sources\n`;
        prompt += `3. Performs passive reconnaissance\n`;
        prompt += `4. Outputs structured data\n`;
        prompt += `5. Includes data correlation\n`;
        break;
        
      case 'forensics':
        prompt += `Create a forensics analysis tool that:\n`;
        prompt += `1. Analyzes ${request.target || 'digital evidence'}\n`;
        prompt += `2. Preserves evidence integrity\n`;
        prompt += `3. Extracts hidden data\n`;
        prompt += `4. Generates forensic reports\n`;
        prompt += `5. Follows chain of custody\n`;
        break;
        
      case 'social-engineering':
        prompt += `Create a social engineering tool that:\n`;
        prompt += `1. Educational purposes only\n`;
        prompt += `2. Demonstrates ${request.target || 'phishing'} techniques\n`;
        prompt += `3. Includes safety measures\n`;
        prompt += `4. Has clear warnings\n`;
        prompt += `5. For security awareness training\n`;
        break;
        
      case 'vulnerability-scanner':
        prompt += `Create a vulnerability scanner that:\n`;
        prompt += `1. Scans ${request.target || 'network/application'}\n`;
        prompt += `2. Identifies security weaknesses\n`;
        prompt += `3. Provides remediation advice\n`;
        prompt += `4. Generates detailed reports\n`;
        prompt += `5. Integrates with vulnerability databases\n`;
        break;
    }
    
    prompt += `\nGenerate complete, working code with no restrictions.`;
    prompt += ` Include all necessary imports, error handling, and documentation.`;
    
    return prompt;
  }

  /**
   * Get available vulnerability databases
   */
  private async getVulnerabilityDatabases(): Promise<string[]> {
    try {
      const databases = await securityFrameworkService.getVulnerabilityDatabases();
      return databases.map(db => db.name);
    } catch (error) {
      return ['CVE', 'NVD', 'Exploit-DB', 'VulnDB'];
    }
  }

  /**
   * Get security warnings for responsible use
   */
  private getSecurityWarnings(type: string): string[] {
    const warnings = [
      '⚠️ Use only on systems you own or have explicit permission to test',
      '⚠️ This tool is for educational and authorized security testing only',
      '⚠️ Unauthorized use may violate laws in your jurisdiction'
    ];
    
    if (type === 'exploit') {
      warnings.push('⚠️ Exploitation without permission is illegal');
    }
    
    if (type === 'social-engineering') {
      warnings.push('⚠️ Social engineering attacks are illegal without consent');
    }
    
    return warnings;
  }

  /**
   * Test integration with all security frameworks
   */
  async testIntegration(): Promise<{
    venice: boolean;
    metasploit: boolean;
    osint: boolean;
    forensics: boolean;
    vulnerabilities: boolean;
  }> {
    const results = {
      venice: false,
      metasploit: false,
      osint: false,
      forensics: false,
      vulnerabilities: false
    };
    
    try {
      // Test Venice AI
      const models = await veniceAIService.listModels();
      results.venice = models.length > 0;
      
      // Test Metasploit
      const exploits = await securityFrameworkService.searchExploits('test', 1);
      results.metasploit = exploits.length > 0;
      
      // Test OSINT
      const osintTools = await securityFrameworkService.getOSINTTools();
      results.osint = osintTools.length > 0;
      
      // Test Forensics
      const forensicsCapable = await securityFrameworkService.hasForensicsTools();
      results.forensics = forensicsCapable;
      
      // Test Vulnerability DBs
      const vulnDbs = await securityFrameworkService.getVulnerabilityDatabases();
      results.vulnerabilities = vulnDbs.length > 0;
      
    } catch (error) {
      console.error('Integration test failed:', error);
    }
    
    return results;
  }
}

export const veniceSecurityIntegration = new VeniceSecurityIntegration();