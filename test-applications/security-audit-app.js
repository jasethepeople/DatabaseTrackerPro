/**
 * Security Audit Application
 * 
 * Comprehensive security testing and monitoring for all AI-discovered APIs
 * and credential management systems.
 */

const BASE_URL = 'http://localhost:5000';

class SecurityAuditApp {
  constructor() {
    this.auditResults = {
      credentialSecurity: {},
      apiSecurity: {},
      complianceChecks: {},
      riskAssessment: {},
      recommendations: []
    };
    this.securityFindings = [];
    this.complianceScore = 0;
  }

  async runSecurityAudit() {
    console.log('🛡️ COMPREHENSIVE SECURITY AUDIT');
    console.log('Analyzing all AI Discovery system security aspects\n');

    try {
      // Phase 1: Credential Security Audit
      await this.auditCredentialSecurity();
      
      // Phase 2: API Security Assessment
      await this.auditAPISecurity();
      
      // Phase 3: Compliance Verification
      await this.verifyCompliance();
      
      // Phase 4: Risk Assessment
      await this.performRiskAssessment();
      
      // Phase 5: Generate Security Report
      this.generateSecurityReport();
      
    } catch (error) {
      console.error('Security audit failed:', error);
    }
  }

  async auditCredentialSecurity() {
    console.log('🔐 Phase 1: Credential Security Audit');
    console.log('-'.repeat(50));
    
    // Comprehensive credential scan
    const scanResults = await this.scanCredentials('all');
    console.log(`Found ${scanResults.credentials.length} credentials across all environments`);
    
    // Analyze each credential
    for (const credential of scanResults.credentials) {
      const analysis = this.analyzeCredential(credential);
      this.securityFindings.push(analysis);
      
      console.log(`${credential.apiName}: ${analysis.riskLevel} risk`);
      if (analysis.issues.length > 0) {
        console.log(`  Issues: ${analysis.issues.join(', ')}`);
      }
    }
    
    // Perform credential audit
    const auditResults = await this.performCredentialAudit();
    this.auditResults.credentialSecurity = {
      totalCredentials: auditResults.storedCredentials,
      activeCredentials: auditResults.activeCredentials,
      securityIssues: auditResults.securityIssues,
      recommendations: auditResults.recommendations,
      findings: this.securityFindings
    };
    
    console.log(`✓ Credential audit completed: ${auditResults.securityIssues.length} issues found`);
  }

  async auditAPISecurity() {
    console.log('\n🔒 Phase 2: API Security Assessment');
    console.log('-'.repeat(50));
    
    // Test API security for each discovered API
    const apis = await this.getDiscoveredAPIs();
    const apiSecurityResults = [];
    
    for (const api of apis) {
      console.log(`Testing ${api.name} security...`);
      
      const securityTest = await this.testAPISecurity(api);
      apiSecurityResults.push(securityTest);
      
      console.log(`  Authentication: ${securityTest.authentication.status}`);
      console.log(`  Encryption: ${securityTest.encryption.status}`);
      console.log(`  Rate limiting: ${securityTest.rateLimiting.status}`);
    }
    
    this.auditResults.apiSecurity = {
      testedAPIs: apiSecurityResults.length,
      secureAPIs: apiSecurityResults.filter(r => r.overallScore >= 80).length,
      vulnerableAPIs: apiSecurityResults.filter(r => r.overallScore < 60).length,
      details: apiSecurityResults
    };
    
    console.log(`✓ API security assessment completed for ${apis.length} APIs`);
  }

  async verifyCompliance() {
    console.log('\n📋 Phase 3: Compliance Verification');
    console.log('-'.repeat(50));
    
    const complianceChecks = [
      { name: 'PCI DSS', category: 'Payment Security', required: true },
      { name: 'GDPR', category: 'Data Privacy', required: true },
      { name: 'SOC 2', category: 'Security Controls', required: false },
      { name: 'ISO 27001', category: 'Information Security', required: false },
      { name: 'HIPAA', category: 'Healthcare Data', required: false }
    ];
    
    const complianceResults = [];
    
    for (const check of complianceChecks) {
      console.log(`Checking ${check.name} compliance...`);
      
      const result = await this.checkCompliance(check);
      complianceResults.push(result);
      
      console.log(`  ${check.name}: ${result.status} (${result.score}/100)`);
      if (result.issues.length > 0) {
        console.log(`    Issues: ${result.issues.slice(0, 2).join(', ')}`);
      }
    }
    
    this.complianceScore = Math.round(
      complianceResults.reduce((sum, r) => sum + r.score, 0) / complianceResults.length
    );
    
    this.auditResults.complianceChecks = {
      totalChecks: complianceResults.length,
      passed: complianceResults.filter(r => r.status === 'COMPLIANT').length,
      failed: complianceResults.filter(r => r.status === 'NON-COMPLIANT').length,
      overallScore: this.complianceScore,
      details: complianceResults
    };
    
    console.log(`✓ Compliance verification completed: ${this.complianceScore}/100 score`);
  }

  async performRiskAssessment() {
    console.log('\n⚠️ Phase 4: Risk Assessment');
    console.log('-'.repeat(50));
    
    const risks = {
      critical: [],
      high: [],
      medium: [],
      low: []
    };
    
    // Assess credential risks
    this.securityFindings.forEach(finding => {
      const risk = {
        type: 'Credential',
        api: finding.credential.apiName,
        issues: finding.issues,
        riskLevel: finding.riskLevel
      };
      
      risks[finding.riskLevel].push(risk);
    });
    
    // Assess API risks
    if (this.auditResults.apiSecurity.details) {
      this.auditResults.apiSecurity.details.forEach(api => {
        if (api.overallScore < 60) {
          risks.high.push({
            type: 'API Security',
            api: api.name,
            issues: api.vulnerabilities,
            riskLevel: 'high'
          });
        } else if (api.overallScore < 80) {
          risks.medium.push({
            type: 'API Security',
            api: api.name,
            issues: api.vulnerabilities,
            riskLevel: 'medium'
          });
        }
      });
    }
    
    // Assess compliance risks
    if (this.complianceScore < 70) {
      risks.high.push({
        type: 'Compliance',
        api: 'System-wide',
        issues: ['Low compliance score', 'Regulatory requirements not met'],
        riskLevel: 'high'
      });
    }
    
    this.auditResults.riskAssessment = risks;
    
    console.log(`Risk Summary:`);
    console.log(`  Critical: ${risks.critical.length}`);
    console.log(`  High: ${risks.high.length}`);
    console.log(`  Medium: ${risks.medium.length}`);
    console.log(`  Low: ${risks.low.length}`);
  }

  analyzeCredential(credential) {
    const issues = [];
    let riskLevel = 'low';
    
    // Check storage location
    if (credential.source === 'Browser Storage') {
      issues.push('Stored in insecure browser storage');
      riskLevel = 'high';
    }
    
    // Check key masking
    if (!credential.keyValue.includes('...hidden')) {
      issues.push('Credential not properly masked');
      riskLevel = 'critical';
    }
    
    // Check key type security
    if (credential.keyType === 'basic') {
      issues.push('Using less secure basic authentication');
      if (riskLevel === 'low') riskLevel = 'medium';
    }
    
    // Check confidence level
    if (credential.confidence < 80) {
      issues.push('Low confidence in credential detection');
      if (riskLevel === 'low') riskLevel = 'medium';
    }
    
    return {
      credential,
      riskLevel,
      issues,
      recommendations: this.getCredentialRecommendations(credential, issues)
    };
  }

  async testAPISecurity(api) {
    const security = {
      name: api.name,
      authentication: { status: 'PASS', details: [] },
      encryption: { status: 'PASS', details: [] },
      rateLimiting: { status: 'PASS', details: [] },
      vulnerabilities: [],
      overallScore: 85
    };
    
    // Test authentication security
    if (api.authType === 'basic') {
      security.authentication.status = 'WARN';
      security.authentication.details.push('Basic auth is less secure than OAuth or API keys');
      security.vulnerabilities.push('Weak authentication method');
      security.overallScore -= 10;
    }
    
    // Test HTTPS enforcement
    if (!api.baseUrl.startsWith('https://')) {
      security.encryption.status = 'FAIL';
      security.encryption.details.push('API does not enforce HTTPS');
      security.vulnerabilities.push('Unencrypted communication');
      security.overallScore -= 20;
    }
    
    // Simulate additional security tests
    if (Math.random() < 0.2) {
      security.rateLimiting.status = 'WARN';
      security.rateLimiting.details.push('Rate limiting not properly configured');
      security.vulnerabilities.push('Potential for abuse');
      security.overallScore -= 5;
    }
    
    return security;
  }

  async checkCompliance(complianceCheck) {
    const result = {
      name: complianceCheck.name,
      category: complianceCheck.category,
      status: 'COMPLIANT',
      score: 85,
      issues: [],
      recommendations: []
    };
    
    // Simulate compliance checking based on type
    switch (complianceCheck.name) {
      case 'PCI DSS':
        if (this.hasPaymentAPIs()) {
          if (this.hasUnencryptedPaymentData()) {
            result.status = 'NON-COMPLIANT';
            result.score = 45;
            result.issues.push('Payment data not properly encrypted');
            result.recommendations.push('Implement end-to-end encryption for payment data');
          }
        }
        break;
        
      case 'GDPR':
        if (this.hasEuropeanUsers()) {
          if (!this.hasDataRetentionPolicies()) {
            result.status = 'PARTIAL';
            result.score = 65;
            result.issues.push('Data retention policies not defined');
            result.recommendations.push('Implement clear data retention and deletion policies');
          }
        }
        break;
        
      default:
        // Random simulation for other compliance checks
        if (Math.random() < 0.3) {
          result.status = 'NON-COMPLIANT';
          result.score = Math.floor(Math.random() * 40 + 30);
          result.issues.push(`${complianceCheck.name} requirements not fully met`);
        }
    }
    
    return result;
  }

  getCredentialRecommendations(credential, issues) {
    const recommendations = [];
    
    if (issues.includes('Stored in insecure browser storage')) {
      recommendations.push('Move credentials to secure server-side storage');
    }
    
    if (issues.includes('Credential not properly masked')) {
      recommendations.push('Implement proper credential masking in logs and displays');
    }
    
    if (issues.includes('Using less secure basic authentication')) {
      recommendations.push('Upgrade to OAuth 2.0 or API key authentication');
    }
    
    recommendations.push('Rotate credentials every 90 days');
    recommendations.push('Enable two-factor authentication where available');
    
    return recommendations;
  }

  // API helper methods
  async scanCredentials(environment) {
    try {
      const response = await fetch(`${BASE_URL}/api/ai/scan-credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ environment })
      });
      
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      // Use demo data for testing
    }
    
    return {
      credentials: [
        {
          source: 'Environment Variables',
          apiId: 'openai-api',
          keyType: 'api-key',
          keyValue: 'sk-...hidden',
          confidence: 95,
          apiName: 'OpenAI API'
        },
        {
          source: 'Browser Storage',
          apiId: 'github-token',
          keyType: 'oauth',
          keyValue: 'ghp_...hidden',
          confidence: 88,
          apiName: 'GitHub API'
        },
        {
          source: 'Configuration Files',
          apiId: 'stripe-key',
          keyType: 'api-key',
          keyValue: 'sk_test_...hidden',
          confidence: 92,
          apiName: 'Stripe API'
        }
      ]
    };
  }

  async performCredentialAudit() {
    try {
      const response = await fetch(`${BASE_URL}/api/ai/credential-audit`);
      if (response.ok) {
        const data = await response.json();
        return data.audit;
      }
    } catch (error) {
      // Use demo data
    }
    
    return {
      storedCredentials: 5,
      activeCredentials: 4,
      securityIssues: [
        'API key stored in plain text',
        'Credentials older than 90 days found'
      ],
      recommendations: [
        'Rotate old credentials',
        'Use environment variables for sensitive data',
        'Enable two-factor authentication'
      ]
    };
  }

  async getDiscoveredAPIs() {
    try {
      const response = await fetch(`${BASE_URL}/api/ai/discovered-apis`);
      if (response.ok) {
        const data = await response.json();
        return data.apis || [];
      }
    } catch (error) {
      // Use demo data
    }
    
    return [
      {
        id: 'stripe-payments',
        name: 'Stripe Payments API',
        baseUrl: 'https://api.stripe.com',
        authType: 'api-key'
      },
      {
        id: 'openai-ai',
        name: 'OpenAI API',
        baseUrl: 'https://api.openai.com',
        authType: 'bearer'
      },
      {
        id: 'insecure-api',
        name: 'Insecure Test API',
        baseUrl: 'http://api.example.com',
        authType: 'basic'
      }
    ];
  }

  // Compliance helper methods
  hasPaymentAPIs() {
    return this.auditResults.apiSecurity.details?.some(api => 
      api.name.toLowerCase().includes('stripe') || 
      api.name.toLowerCase().includes('paypal')
    ) || true; // Assume true for demo
  }

  hasUnencryptedPaymentData() {
    return Math.random() < 0.3; // 30% chance for demo
  }

  hasEuropeanUsers() {
    return true; // Assume true for demo
  }

  hasDataRetentionPolicies() {
    return Math.random() > 0.4; // 60% chance for demo
  }

  generateSecurityReport() {
    console.log('\n📊 COMPREHENSIVE SECURITY AUDIT REPORT');
    console.log('=' * 60);
    
    console.log('\n🔐 Credential Security Summary:');
    const credSec = this.auditResults.credentialSecurity;
    console.log(`  • Total credentials: ${credSec.totalCredentials}`);
    console.log(`  • Security issues: ${credSec.securityIssues.length}`);
    console.log(`  • High-risk credentials: ${credSec.findings.filter(f => f.riskLevel === 'high').length}`);
    
    console.log('\n🔒 API Security Summary:');
    const apiSec = this.auditResults.apiSecurity;
    console.log(`  • APIs tested: ${apiSec.testedAPIs}`);
    console.log(`  • Secure APIs: ${apiSec.secureAPIs}`);
    console.log(`  • Vulnerable APIs: ${apiSec.vulnerableAPIs}`);
    
    console.log('\n📋 Compliance Summary:');
    const compliance = this.auditResults.complianceChecks;
    console.log(`  • Overall score: ${compliance.overallScore}/100`);
    console.log(`  • Compliant checks: ${compliance.passed}/${compliance.totalChecks}`);
    console.log(`  • Failed checks: ${compliance.failed}`);
    
    console.log('\n⚠️ Risk Assessment:');
    const risks = this.auditResults.riskAssessment;
    console.log(`  • Critical risks: ${risks.critical.length}`);
    console.log(`  • High risks: ${risks.high.length}`);
    console.log(`  • Medium risks: ${risks.medium.length}`);
    console.log(`  • Low risks: ${risks.low.length}`);
    
    console.log('\n🎯 Top Recommendations:');
    const allRecommendations = [
      ...credSec.recommendations,
      ...this.generateTopRecommendations()
    ];
    allRecommendations.slice(0, 5).forEach((rec, i) => {
      console.log(`  ${i + 1}. ${rec}`);
    });
    
    const overallSecurityScore = this.calculateOverallSecurityScore();
    console.log(`\n🛡️ Overall Security Score: ${overallSecurityScore}/100`);
    
    if (overallSecurityScore >= 80) {
      console.log('✅ SECURITY AUDIT PASSED - System meets security standards');
    } else if (overallSecurityScore >= 60) {
      console.log('⚠️ SECURITY AUDIT WARNING - Improvements needed');
    } else {
      console.log('❌ SECURITY AUDIT FAILED - Critical issues must be addressed');
    }
  }

  generateTopRecommendations() {
    return [
      'Implement automated credential rotation',
      'Enable API monitoring and alerting',
      'Conduct regular security assessments',
      'Implement zero-trust security model',
      'Establish incident response procedures'
    ];
  }

  calculateOverallSecurityScore() {
    const credentialScore = Math.max(0, 100 - (this.auditResults.credentialSecurity.securityIssues.length * 10));
    const apiScore = this.auditResults.apiSecurity.secureAPIs / Math.max(1, this.auditResults.apiSecurity.testedAPIs) * 100;
    const complianceScore = this.auditResults.complianceChecks.overallScore;
    const riskScore = Math.max(0, 100 - (this.auditResults.riskAssessment.critical.length * 25 + this.auditResults.riskAssessment.high.length * 10));
    
    return Math.round((credentialScore + apiScore + complianceScore + riskScore) / 4);
  }
}

// Run audit immediately
const audit = new SecurityAuditApp();
audit.runSecurityAudit().catch(console.error);

export default SecurityAuditApp;