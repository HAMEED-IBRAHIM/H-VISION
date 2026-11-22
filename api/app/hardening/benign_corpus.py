"""
H-VISION Adversarial Hardening — Benign Traffic Corpus
A curated benchmark of safe, normal, legitimate traffic.
Every candidate WAF rule MUST pass this benchmark with 0% False Positives.
"""

BENIGN_SAMPLES = [
    # ── 1. Legitimate Names with Quotes & Punctuation ──
    "Conan O'Brien",
    "Shaquille O'Neal",
    "Eugene O'Neill",
    "Miles D'Angelo",
    "Ronald McDonald",
    "Sean O'Hagan",
    "Jean-Luc Picard",
    "John O'Connor & Sons",
    "Mary-Kate and Ashley",
    
    # ── 2. Normal Business Text Containing SQL Keywords ──
    "Please select your preferred delivery date from the dropdown menu.",
    "The labor union met yesterday to negotiate the contract.",
    "Union of Concerned Scientists published a new report.",
    "Please drop off your badge at the security desk before leaving.",
    "Click here to insert a table into your presentation.",
    "Order by 5 PM for next-day shipping guarantee.",
    "Create a new profile to get started with our services.",
    "Update your contact information in the profile settings tab.",
    "Delete unwanted drafts from your inbox to free up storage.",
    "We offer table service and carryout dining options.",
    "Executive committee meeting will alter the roadmap.",
    
    # ── 3. Valid HTML & Markup Content ──
    "<b>Important Notice:</b> The office will be closed on Friday.",
    "<strong>Welcome!</strong> Thank you for creating an account.",
    "Use &lt; or &gt; for comparison operators in your documentation.",
    "<p>This is a standard blog post paragraph with no scripts.</p>",
    "<span class=\"badge bg-success\">Order Confirmed</span>",
    "Check out our new products: TV & Home Audio (55\" 4K OLED)",
    
    # ── 4. Search Queries & Programming Discussion ──
    "How to use SQL SELECT statement with parameterized queries in Python",
    "Understanding SQL JOIN vs UNION operations in database design",
    "Differences between <script> tag attributes async and defer",
    "Items priced < $100 and rating >= 4.5 stars",
    "Search terms: C++ pointers, references, and memory allocation",
    "Error code 404: Page not found on server",
    "JSON format: {\"status\": \"success\", \"user_id\": 1024}",
    
    # ── 5. Standard Form Fields & User Messages ──
    "Hello! I would like to inquire about bulk enterprise pricing.",
    "My email address is support@janus-security.org",
    "Phone number: +1 (555) 234-5678, ext. 90",
    "Address: 742 Evergreen Terrace, Apt #4B, Springfield",
    "Feedback: The dashboard is intuitive, fast, and 100% reliable!",
    "Password reset requested for username: security_lead_2026",
]

def get_benign_corpus():
    """Return the list of benign samples for false-positive validation."""
    return BENIGN_SAMPLES
