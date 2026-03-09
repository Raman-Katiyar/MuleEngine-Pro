"""
Quick fix script to repair analysis_engine.py with literal \n characters
"""

with open('src/backend/app/services/analysis_engine.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace literal escapes with actual characters
content_fixed = content.replace('\\n', '\n').replace('\\"', '"').replace("\\'", "'")

with open('src/backend/app/services/analysis_engine.py', 'w', encoding='utf-8') as f:
    f.write(content_fixed)

print("Fixed analysis_engine.py - replaced literal escapes with actual characters")
