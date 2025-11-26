# Security Recommendations for MaxBuild

**Date**: November 26, 2025  
**Severity**: HIGH

## Critical: xlsx Package Vulnerabilities

### Overview

The current implementation uses the `xlsx` package (v0.18.5) which has known high-severity security vulnerabilities. While the functionality is fully implemented and working, these vulnerabilities pose a significant risk for a production application that processes user-uploaded files.

### Vulnerabilities Identified

#### 1. Prototype Pollution (GHSA-4r6h-8v6p-xvw6)
- **Severity**: HIGH (CVSS 7.8)
- **CWE**: CWE-1321 (Improperly Controlled Modification of Object Prototype Attributes)
- **Vector**: CVSS:3.1/AV:L/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:H
- **Description**: All versions of SheetJS CE through 0.19.2 are vulnerable to Prototype Pollution when reading specially crafted files
- **Impact**: Workflows that read arbitrary user-uploaded files are affected
- **Status**: No fix available in xlsx package

#### 2. Regular Expression Denial of Service (GHSA-5pgg-2g8v-p4x9)
- **Severity**: Moderate
- **Type**: ReDoS vulnerability
- **Impact**: Potential for denial of service through malicious file content

### Risk Assessment

**Current Risk Level**: HIGH

**Justification**:
- ✅ Application accepts arbitrary user-uploaded Excel files
- ✅ Files are processed server-side without sandboxing
- ✅ Prototype pollution could lead to:
  - Code execution in specific scenarios
  - Data manipulation
  - Authentication bypass
  - Privilege escalation
- ✅ ReDoS could cause service disruption

---

## Recommended Solutions

### Option 1: Migrate to ExcelJS (RECOMMENDED)

**Package**: `exceljs` v4.4.0  
**Status**: Actively maintained, no known vulnerabilities  
**License**: MIT

**Advantages**:
- ✅ No known security vulnerabilities
- ✅ Actively maintained with regular updates
- ✅ More features than xlsx
- ✅ Better TypeScript support
- ✅ Supports streaming for large files
- ✅ Can both read and write Excel files

**Migration Effort**: Medium (1-2 days)

**Changes Required**:
1. Update `package.json` dependencies
2. Refactor `ExcelLoader` class
3. Update type definitions
4. Test with existing Excel files
5. Update documentation

**Example Migration**:

```typescript
// Current (xlsx)
import * as XLSX from 'xlsx';
const workbook = XLSX.read(dataBuffer, { type: 'buffer' });
const worksheet = workbook.Sheets[sheetName];
const jsonData = XLSX.utils.sheet_to_json(worksheet);

// New (exceljs)
import ExcelJS from 'exceljs';
const workbook = new ExcelJS.Workbook();
await workbook.xlsx.load(dataBuffer);
const worksheet = workbook.getWorksheet(sheetName);
const jsonData = worksheet.getSheetValues();
```

---

### Option 2: Implement Security Hardening

If migrating is not immediately possible, implement these security measures:

#### A. Input Validation and Sanitization

```typescript
// Add before processing in ExcelLoader
class ExcelLoader {
  private validateFileStructure(buffer: Buffer): void {
    // Check file size
    if (buffer.length > 10 * 1024 * 1024) {
      throw new Error('File too large');
    }
    
    // Verify Excel file signature
    const signature = buffer.slice(0, 4);
    const validSignatures = [
      Buffer.from([0x50, 0x4B, 0x03, 0x04]), // .xlsx (ZIP)
      Buffer.from([0xD0, 0xCF, 0x11, 0xE0]), // .xls (CFB)
    ];
    
    if (!validSignatures.some(sig => sig.equals(signature))) {
      throw new Error('Invalid Excel file format');
    }
  }
}
```

#### B. Sandboxed Processing

```typescript
// Use VM2 for isolated execution
import { VM } from 'vm2';

class ExcelService {
  async processExcelSandboxed(filePath: string) {
    const vm = new VM({
      timeout: 30000, // 30 second timeout
      sandbox: {
        Buffer,
        console: {
          log: (...args: any[]) => console.log('[Sandbox]', ...args),
          error: (...args: any[]) => console.error('[Sandbox]', ...args),
        },
      },
    });
    
    // Process in isolated environment
    return vm.run(/* processing code */);
  }
}
```

#### C. Object Freeze Protection

```typescript
// Freeze Object prototype to prevent pollution
Object.freeze(Object.prototype);
Object.freeze(Array.prototype);

// Add at application startup in src/index.ts
```

#### D. Resource Limits

```typescript
// Add in ExcelLoader
class ExcelLoader {
  private readonly MAX_SHEETS = 50;
  private readonly MAX_ROWS_PER_SHEET = 100000;
  private readonly MAX_CELLS_PER_SHEET = 1000000;
  
  async load(filePath: string): Promise<ExcelData> {
    const workbook = XLSX.read(dataBuffer, { 
      type: 'buffer',
      cellStyles: false, // Disable to reduce memory
      cellFormula: false, // Disable formula evaluation
      sheetRows: this.MAX_ROWS_PER_SHEET, // Limit rows
    });
    
    if (workbook.SheetNames.length > this.MAX_SHEETS) {
      throw new Error('Too many sheets in workbook');
    }
    
    // Additional validation...
  }
}
```

---

### Option 3: Alternative Packages

#### A. xlsx-populate
- **Version**: v1.21.0
- **Pros**: Good API, supports both read and write
- **Cons**: Less active than exceljs
- **Vulnerabilities**: None known currently

#### B. node-xlsx
- **Version**: v0.24.0
- **Pros**: Simple API, built on xlsx
- **Cons**: Still uses xlsx internally (same vulnerabilities)
- **Vulnerabilities**: Inherits xlsx vulnerabilities

#### C. xlsx-style (Don't use)
- **Status**: Deprecated, unmaintained
- **Vulnerabilities**: Multiple known issues

---

## Implementation Plan

### Phase 1: Immediate Actions (Week 1)

1. **Document the Risk**
   - ✅ Create this security document
   - ✅ Add to README security section
   - ✅ Inform stakeholders

2. **Implement Quick Wins**
   - Add file signature validation
   - Add resource limits
   - Add timeout protection
   - Add better error handling

3. **Monitoring**
   - Add logging for Excel processing
   - Monitor for unusual patterns
   - Set up alerts for processing failures

### Phase 2: Migration (Week 2-3)

1. **Prepare**
   - Review exceljs documentation
   - Create migration plan
   - Set up test environment

2. **Implement**
   - Install exceljs
   - Refactor ExcelLoader
   - Update ExcelService
   - Update type definitions

3. **Test**
   - Unit tests for ExcelLoader
   - Integration tests for upload flow
   - Test with various Excel formats
   - Performance testing

4. **Deploy**
   - Update documentation
   - Deploy to staging
   - Monitor for issues
   - Deploy to production

### Phase 3: Long-term Security (Ongoing)

1. **Regular Audits**
   - Run `npm audit` regularly
   - Monitor security advisories
   - Update dependencies quarterly

2. **Security Testing**
   - Penetration testing
   - Fuzzing with malformed files
   - Load testing

3. **Incident Response**
   - Create incident response plan
   - Document escalation procedures
   - Regular security drills

---

## Testing Security Measures

### Test Cases for Prototype Pollution

```typescript
// test-prototype-pollution.ts
describe('Prototype Pollution Protection', () => {
  it('should not allow prototype pollution via Excel', async () => {
    // Create malicious Excel file with __proto__ manipulation
    const maliciousBuffer = createMaliciousExcel();
    
    await expect(
      excelLoader.loadFromBuffer(maliciousBuffer)
    ).rejects.toThrow();
    
    // Verify prototype is not polluted
    expect(({}).__proto__).toBeDefined();
    expect(({}).__proto__.isAdmin).toBeUndefined();
  });
});
```

### Test Cases for Resource Exhaustion

```typescript
describe('Resource Limit Protection', () => {
  it('should reject files with too many sheets', async () => {
    const largeFile = createExcelWithSheets(100);
    await expect(
      excelLoader.load(largeFile)
    ).rejects.toThrow('Too many sheets');
  });
  
  it('should reject files with too many rows', async () => {
    const largeFile = createExcelWithRows(200000);
    await expect(
      excelLoader.load(largeFile)
    ).rejects.toThrow('Too many rows');
  });
});
```

---

## Deployment Considerations

### Environment Variables

Add to `.env.example`:
```bash
# Excel Processing Security
EXCEL_MAX_FILE_SIZE=10485760        # 10MB
EXCEL_MAX_SHEETS=50
EXCEL_MAX_ROWS_PER_SHEET=100000
EXCEL_PROCESSING_TIMEOUT=30000      # 30 seconds
```

### Monitoring and Alerting

```typescript
// Add to Excel processing
import { performance } from 'perf_hooks';

class ExcelService {
  async processExcel(filePath: string) {
    const startTime = performance.now();
    
    try {
      const result = await this.excelLoader.load(filePath);
      const duration = performance.now() - startTime;
      
      // Log metrics
      console.log(`Excel processed in ${duration}ms`, {
        sheets: result.sheetCount,
        fileSize: (await fs.stat(filePath)).size,
        duration,
      });
      
      // Alert if processing takes too long
      if (duration > 30000) {
        console.warn('Excel processing timeout risk', { filePath, duration });
      }
      
      return result;
    } catch (error) {
      console.error('Excel processing failed', { filePath, error });
      throw error;
    }
  }
}
```

---

## Additional Security Recommendations

### 1. Content Security Policy (Frontend)

Add CSP headers to prevent XSS if Excel data is displayed:

```typescript
// In Express middleware
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'"
  );
  next();
});
```

### 2. File Type Detection

Use magic number detection in addition to MIME types:

```typescript
import fileType from 'file-type';

async function validateFileType(buffer: Buffer) {
  const type = await fileType.fromBuffer(buffer);
  
  if (!type || !['xlsx', 'xls'].includes(type.ext)) {
    throw new Error('Invalid file type');
  }
}
```

### 3. Rate Limiting

Already implemented but ensure it's sufficient:
- Current: 10 uploads per 15 minutes per IP
- Consider: Lower to 5 for production
- Consider: Add per-user limits

### 4. Audit Logging

Log all file processing activities:

```typescript
interface AuditLog {
  timestamp: Date;
  userId?: string;
  ipAddress: string;
  action: 'upload' | 'process' | 'download';
  fileName: string;
  fileSize: number;
  status: 'success' | 'failure';
  errorMessage?: string;
}

function logAudit(entry: AuditLog) {
  // Log to database or external service
  prisma.auditLog.create({ data: entry });
}
```

---

## Compliance Considerations

### GDPR/Privacy

- Ensure uploaded files are deleted after processing
- Add data retention policy
- Implement user data deletion
- Document data processing activities

### SOC 2 / ISO 27001

- Regular security assessments
- Vulnerability management process
- Incident response procedures
- Access control and authentication

---

## Conclusion

The current Excel implementation is functionally complete but has critical security vulnerabilities due to the xlsx package. **Migration to exceljs is strongly recommended** for production use.

**Timeline**:
- Immediate: Implement basic security hardening (1-2 days)
- Short-term: Complete migration to exceljs (1-2 weeks)
- Long-term: Establish security monitoring and testing (ongoing)

**Priority**: HIGH - Address before production deployment

---

## References

- GHSA-4r6h-8v6p-xvw6: https://github.com/advisories/GHSA-4r6h-8v6p-xvw6
- GHSA-5pgg-2g8v-p4x9: https://github.com/advisories/GHSA-5pgg-2g8v-p4x9
- ExcelJS: https://github.com/exceljs/exceljs
- OWASP Prototype Pollution: https://owasp.org/www-community/attacks/Prototype_pollution
- CWE-1321: https://cwe.mitre.org/data/definitions/1321.html
