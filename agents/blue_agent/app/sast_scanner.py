import subprocess
import json
import logging
from typing import List, Dict, Any
import os

logger = logging.getLogger(__name__)

class Finding:
    def __init__(self, tool: str, file: str, line: int, severity: str, message: str, rule_id: str):
        self.tool = tool
        self.file = file
        self.line = line
        self.severity = severity
        self.message = message
        self.rule_id = rule_id

    def to_dict(self) -> Dict[str, Any]:
        return {
            "tool": self.tool,
            "file": self.file,
            "line": self.line,
            "severity": self.severity,
            "message": self.message,
            "rule_id": self.rule_id
        }

class SASTScanner:
    """
    Executes external Static Application Security Testing (SAST) and 
    Software Composition Analysis (SCA) tools.
    """
    
    @staticmethod
    def run_bandit(source_path: str) -> List[Finding]:
        findings = []
        try:
            logger.info(f"Running Bandit on {source_path}")
            result = subprocess.run(
                ["bandit", "-r", source_path, "-f", "json"],
                capture_output=True,
                text=True
            )
            # Bandit returns non-zero if issues are found, which is expected
            if result.stdout:
                data = json.loads(result.stdout)
                for issue in data.get("results", []):
                    findings.append(Finding(
                        tool="bandit",
                        file=issue.get("filename", ""),
                        line=issue.get("line_number", 0),
                        severity=issue.get("issue_severity", "LOW").lower(),
                        message=issue.get("issue_text", ""),
                        rule_id=issue.get("test_id", "")
                    ))
        except FileNotFoundError:
            logger.warning("Bandit is not installed or not in PATH.")
        except json.JSONDecodeError:
            logger.error("Failed to parse Bandit JSON output.")
        except Exception as e:
            logger.error(f"Error running Bandit: {e}")
        return findings

    @staticmethod
    def run_trivy_fs(source_path: str) -> List[Finding]:
        findings = []
        try:
            logger.info(f"Running Trivy on {source_path}")
            result = subprocess.run(
                ["trivy", "fs", "--format", "json", source_path],
                capture_output=True,
                text=True
            )
            if result.stdout:
                data = json.loads(result.stdout)
                results = data.get("Results", [])
                for res in results:
                    target = res.get("Target", "")
                    for vuln in res.get("Vulnerabilities", []):
                        findings.append(Finding(
                            tool="trivy",
                            file=target,
                            line=0, # Trivy usually doesn't give line numbers for dependencies
                            severity=vuln.get("Severity", "LOW").lower(),
                            message=f"{vuln.get('PkgName')} {vuln.get('InstalledVersion')} -> {vuln.get('VulnerabilityID')} : {vuln.get('Title')}",
                            rule_id=vuln.get("VulnerabilityID", "")
                        ))
        except FileNotFoundError:
            logger.warning("Trivy is not installed or not in PATH.")
        except json.JSONDecodeError:
            logger.error("Failed to parse Trivy JSON output.")
        except Exception as e:
            logger.error(f"Error running Trivy: {e}")
        return findings

    @staticmethod
    def run_all(source_path: str) -> List[Dict[str, Any]]:
        all_findings = []
        all_findings.extend([f.to_dict() for f in SASTScanner.run_bandit(source_path)])
        all_findings.extend([f.to_dict() for f in SASTScanner.run_trivy_fs(source_path)])
        return all_findings
