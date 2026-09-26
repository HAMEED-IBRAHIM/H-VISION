import hashlib
import os
import difflib
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)

@dataclass
class PatchProposal:
    patch_type: str
    target_file: str
    original_hash: str
    unified_diff: str
    explanation: str

class PatchGenerator:
    """
    Generates automated code patches based on identified vulnerability types.
    """
    
    @staticmethod
    def _generate_diff(original_content: str, new_content: str, file_path: str) -> str:
        diff = difflib.unified_diff(
            original_content.splitlines(keepends=True),
            new_content.splitlines(keepends=True),
            fromfile=f"a/{file_path}",
            tofile=f"b/{file_path}",
            n=3
        )
        return "".join(diff)

    @staticmethod
    def _get_file_hash(content: str) -> str:
        return hashlib.sha256(content.encode('utf-8')).hexdigest()

    @staticmethod
    def generate(vulnerability_type: str, target_file: str, original_content: str) -> PatchProposal:
        """
        Attempts to generate a patch for a specific vulnerability type.
        """
        # Note: In a production scenario, this would use AST parsing or an LLM to accurately apply complex patches.
        # This is a simplified deterministic example for common lab vulnerabilities.
        
        new_content = original_content
        explanation = "No patch generated."
        
        if vulnerability_type == "sql_injection":
             # Very basic heuristic for replacing f-string SQL queries with parameterized sqlite3 queries
             if "query = f\"SELECT" in new_content:
                 new_content = new_content.replace(
                     "query = f\"SELECT id, name, secret FROM users WHERE name = '{name}'\"",
                     "query = \"SELECT id, name, secret FROM users WHERE name = ?\""
                 ).replace(
                     "cursor.execute(query)",
                     "cursor.execute(query, (name,))"
                 )
                 explanation = "Replaced vulnerable f-string string concatenation with parameterized SQL query."
        elif vulnerability_type == "xss":
            if "comments.append(comment_text)" in new_content:
                new_content = new_content.replace(
                    "comments.append(comment_text)",
                    "import html\n        comments.append(html.escape(comment_text))"
                )
                explanation = "Applied HTML entity encoding to user input before storage to prevent XSS."
        
        original_hash = PatchGenerator._get_file_hash(original_content)
        unified_diff = PatchGenerator._generate_diff(original_content, new_content, target_file)

        return PatchProposal(
            patch_type=vulnerability_type,
            target_file=target_file,
            original_hash=original_hash,
            unified_diff=unified_diff,
            explanation=explanation
        )
