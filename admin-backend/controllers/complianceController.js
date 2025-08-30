const fs = require('fs').promises;
const path = require('path');

// @desc    Get Privacy Policy
// @route   GET /api/compliance/privacy-policy
// @access  Public
const getPrivacyPolicy = async (req, res) => {
  try {
    const policyPath = path.join(__dirname, '../policies/privacy-policy.md');
    const policyContent = await fs.readFile(policyPath, 'utf8');
    
    res.json({
      success: true,
      data: {
        title: 'Privacy Policy',
        content: policyContent,
        lastUpdated: '2024-08-26',
        version: '1.0'
      }
    });
  } catch (error) {
    console.error('Error reading privacy policy:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving privacy policy'
    });
  }
};

// @desc    Get Cookie Policy
// @route   GET /api/compliance/cookie-policy
// @access  Public
const getCookiePolicy = async (req, res) => {
  try {
    const policyPath = path.join(__dirname, '../policies/cookie-policy.md');
    const policyContent = await fs.readFile(policyPath, 'utf8');
    
    res.json({
      success: true,
      data: {
        title: 'Cookie Policy',
        content: policyContent,
        lastUpdated: '2024-08-26',
        version: '1.0'
      }
    });
  } catch (error) {
    console.error('Error reading cookie policy:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving cookie policy'
    });
  }
};

// @desc    Get Security Statement
// @route   GET /api/compliance/security-statement
// @access  Public
const getSecurityStatement = async (req, res) => {
  try {
    const policyPath = path.join(__dirname, '../policies/security-statement.md');
    const policyContent = await fs.readFile(policyPath, 'utf8');
    
    res.json({
      success: true,
      data: {
        title: 'Security Statement',
        content: policyContent,
        lastUpdated: '2024-08-26',
        version: '1.0'
      }
    });
  } catch (error) {
    console.error('Error reading security statement:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving security statement'
    });
  }
};

// @desc    Get all compliance policies
// @route   GET /api/compliance/policies
// @access  Public
const getAllPolicies = async (req, res) => {
  try {
    const policies = [
      {
        id: 'privacy-policy',
        title: 'Privacy Policy',
        description: 'How we collect, use, and protect your personal information',
        url: '/api/compliance/privacy-policy',
        lastUpdated: '2024-08-26',
        version: '1.0'
      },
      {
        id: 'cookie-policy',
        title: 'Cookie Policy',
        description: 'How we use cookies and tracking technologies',
        url: '/api/compliance/cookie-policy',
        lastUpdated: '2024-08-26',
        version: '1.0'
      },
      {
        id: 'security-statement',
        title: 'Security Statement',
        description: 'Our comprehensive approach to data and system security',
        url: '/api/compliance/security-statement',
        lastUpdated: '2024-08-26',
        version: '1.0'
      }
    ];
    
    res.json({
      success: true,
      data: policies
    });
  } catch (error) {
    console.error('Error retrieving policies:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving compliance policies'
    });
  }
};

// @desc    Get data storage compliance information
// @route   GET /api/compliance/data-storage
// @access  Public
const getDataStorageCompliance = async (req, res) => {
  try {
    const complianceInfo = {
      compliantRegions: [
        {
          region: 'United States',
          status: 'Compliant',
          certifications: ['SOC 2 Type II', 'ISO 27001'],
          dataCenters: ['AWS US East', 'AWS US West'],
          legalFramework: 'CCPA, State Privacy Laws'
        },
        {
          region: 'United Kingdom',
          status: 'Compliant',
          certifications: ['UK GDPR', 'ISO 27001'],
          dataCenters: ['AWS EU-West'],
          legalFramework: 'UK GDPR, Data Protection Act 2018'
        },
        {
          region: 'European Union',
          status: 'Compliant',
          certifications: ['GDPR', 'ISO 27001'],
          dataCenters: ['AWS EU-West', 'AWS EU-Central'],
          legalFramework: 'GDPR, ePrivacy Directive'
        },
        {
          region: 'Canada',
          status: 'Compliant',
          certifications: ['PIPEDA', 'ISO 27001'],
          dataCenters: ['AWS Canada Central'],
          legalFramework: 'PIPEDA, Provincial Privacy Laws'
        }
      ],
      dataTransferMechanisms: [
        'Standard Contractual Clauses (SCCs)',
        'Adequacy Decisions',
        'Binding Corporate Rules',
        'Consent-based transfers'
      ],
      securityMeasures: [
        'AES-256 encryption at rest and in transit',
        'Multi-factor authentication',
        'Role-based access control',
        'Regular security audits',
        '24/7 monitoring and alerting'
      ],
      retentionPolicies: {
        activeClientData: 'Duration of client relationship',
        inactiveClientData: '7 years after service termination',
        legalDocuments: 'As required by applicable law',
        marketingData: 'Until consent withdrawal or 2 years of inactivity'
      }
    };
    
    res.json({
      success: true,
      data: complianceInfo
    });
  } catch (error) {
    console.error('Error retrieving data storage compliance:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving data storage compliance information'
    });
  }
};

// @desc    Get compliance status for specific client
// @route   GET /api/compliance/client/:clientId
// @access  Private
const getClientComplianceStatus = async (req, res) => {
  try {
    const { clientId } = req.params;
    
    // This would typically query the database for client-specific compliance info
    const clientCompliance = {
      clientId,
      dataStorageRegion: 'United States', // Based on client agreement
      applicableRegulations: ['CCPA', 'GDPR'],
      dataProcessingAgreement: {
        status: 'Active',
        effectiveDate: '2024-01-01',
        expirationDate: '2025-01-01'
      },
      securityCertifications: ['SOC 2 Type II', 'ISO 27001'],
      auditTrail: {
        lastAudit: '2024-06-15',
        nextAudit: '2024-12-15',
        complianceScore: 98.5
      },
      dataRetention: {
        policy: '7 years after service termination',
        nextReview: '2024-12-01'
      }
    };
    
    res.json({
      success: true,
      data: clientCompliance
    });
  } catch (error) {
    console.error('Error retrieving client compliance status:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving client compliance status'
    });
  }
};

// @desc    Update client data storage preferences
// @route   PUT /api/compliance/client/:clientId/storage
// @access  Private
const updateClientDataStorage = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { preferredRegion, backupRegion, complianceRequirements } = req.body;
    
    // Validate regions are compliant
    const compliantRegions = ['US', 'UK', 'EU', 'CA'];
    if (!compliantRegions.includes(preferredRegion)) {
      return res.status(400).json({
        success: false,
        message: 'Selected region is not compliant with our data storage policies'
      });
    }
    
    // This would typically update the database
    const updatedStorage = {
      clientId,
      preferredRegion,
      backupRegion,
      complianceRequirements,
      updatedAt: new Date(),
      status: 'Active'
    };
    
    res.json({
      success: true,
      message: 'Client data storage preferences updated successfully',
      data: updatedStorage
    });
  } catch (error) {
    console.error('Error updating client data storage:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating client data storage preferences'
    });
  }
};

// @desc    Get compliance audit log
// @route   GET /api/compliance/audit-log
// @access  Private/Admin
const getComplianceAuditLog = async (req, res) => {
  try {
    // This would typically query the database for audit logs
    const auditLog = [
      {
        id: 1,
        action: 'Data Storage Region Changed',
        clientId: 'CLIENT001',
        oldValue: 'EU',
        newValue: 'US',
        timestamp: '2024-08-26T10:30:00Z',
        userId: 'admin123'
      },
      {
        id: 2,
        action: 'Privacy Policy Updated',
        clientId: null,
        oldValue: 'v1.0',
        newValue: 'v1.1',
        timestamp: '2024-08-25T15:45:00Z',
        userId: 'legal123'
      }
    ];
    
    res.json({
      success: true,
      data: auditLog
    });
  } catch (error) {
    console.error('Error retrieving compliance audit log:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving compliance audit log'
    });
  }
};

module.exports = {
  getPrivacyPolicy,
  getCookiePolicy,
  getSecurityStatement,
  getAllPolicies,
  getDataStorageCompliance,
  getClientComplianceStatus,
  updateClientDataStorage,
  getComplianceAuditLog
};
