#!/usr/bin/env python3
"""
Master All Questions Generator
Creates a comprehensive master file with ALL questions from the Goosechase CSV
Includes TEXT, CAMERA, and GPS type questions organized by category
"""

import csv
import re
from pathlib import Path
from collections import defaultdict

def clean_text(text):
    """Clean and format text for better readability"""
    if not text:
        return ""
    
    # Remove extra whitespace and normalize line breaks
    cleaned = text.strip().replace('\n', ' ').replace('\r', '')
    # Remove multiple spaces
    while '  ' in cleaned:
        cleaned = cleaned.replace('  ', ' ')
    
    return cleaned

def categorize_question(name, mission_type):
    """Categorize questions by type"""
    name_lower = name.lower()
    
    # GPS Questions
    if mission_type == 'GPS':
        return 'GPS_CHECKIN'
    
    # Speaker Questions
    if any(x in name for x in ['Speaker Fun Fact', 'Session Quiz', 'Bonus Research']):
        return 'SPEAKER'
    
    # Sponsor Questions  
    if 'Sponsor' in name:
        return 'SPONSOR'
    
    # General Categories
    if name.startswith('General'):
        return 'GENERAL'
    elif name.startswith('Fun'):
        return 'FUN'
    elif name.startswith('Networking'):
        return 'NETWORKING'
    elif 'Trivia' in name:
        return 'TRIVIA'
    elif any(x in name for x in ['History', 'Flashback', 'Rewind', 'Time Machine', 'Backtrack', 'Past Perfect', 'Throwback']):
        return 'HISTORY'
    else:
        return 'OTHER'

def parse_all_questions(csv_path):
    """Parse CSV and get ALL questions organized by category"""
    categories = defaultdict(list)
    total_questions = 0
    
    with open(csv_path, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        
        for row in reader:
            mission_type = row.get('Type', '').strip()
            name = clean_text(row.get('Name', ''))
            description = clean_text(row.get('Description', ''))
            points = row.get('Points', '').strip()
            accepted_answers = clean_text(row.get('Accepted Answers', ''))
            visible = row.get('Visible in feed?', '').strip()
            camera_allowed = row.get('Camera Library Upload Allowed?', '').strip()
            gps_location = clean_text(row.get('GPS Location', ''))
            
            if name and description:
                total_questions += 1
                category = categorize_question(name, mission_type)
                
                question_data = {
                    'number': total_questions,
                    'type': mission_type,
                    'name': name,
                    'question': description,
                    'answer': accepted_answers if accepted_answers else "[Any answer accepted]",
                    'points': points if points else "0",
                    'visible': visible,
                    'camera_allowed': camera_allowed,
                    'gps_location': gps_location
                }
                
                categories[category].append(question_data)
    
    return categories, total_questions

def format_master_file(categories, total_questions):
    """Format the comprehensive master file"""
    output = []
    
    # Header
    output.append("=" * 100)
    output.append("M365 NYC GOOSECHASE - COMPLETE MASTER LIST - ALL QUESTIONS & ANSWERS")
    output.append("=" * 100)
    output.append("")
    output.append(f"TOTAL QUESTIONS: {total_questions}")
    output.append("")
    
    # Category summary
    output.append("CATEGORIES SUMMARY:")
    output.append("-" * 50)
    for category, questions in sorted(categories.items()):
        output.append(f"{category:20} {len(questions):3} questions")
    output.append("")
    output.append("=" * 100)
    output.append("\f")  # Page break
    
    # Detailed questions by category
    for category, questions in sorted(categories.items()):
        if not questions:
            continue
            
        # Category header
        output.append("")
        output.append("=" * 100)
        output.append(f"CATEGORY: {category}")
        output.append("=" * 100)
        output.append(f"Questions in this category: {len(questions)}")
        output.append("")
        
        # Category description
        descriptions = {
            'GPS_CHECKIN': 'Location-based check-in questions requiring physical presence',
            'SPEAKER': 'Questions related to conference speakers (Fun Facts, Session Quizzes, Research)',
            'SPONSOR': 'Questions related to event sponsors and their services',
            'GENERAL': 'General event and welcome questions',
            'FUN': 'Fun photo challenges and interactive activities',
            'NETWORKING': 'Social networking and interaction challenges',
            'TRIVIA': 'General trivia questions about Microsoft and community',
            'HISTORY': 'Historical questions about Microsoft and M365 Community Days',
            'OTHER': 'Miscellaneous questions not fitting other categories'
        }
        
        if category in descriptions:
            output.append(f"Description: {descriptions[category]}")
            output.append("")
        
        # Questions in category
        for i, q in enumerate(questions, 1):
            output.append(f"QUESTION {q['number']} (Category {i}):")
            output.append(f"Title: {q['name']}")
            output.append(f"Type: {q['type']}")
            output.append(f"Points: {q['points']}")
            
            if q['type'] == 'GPS' and q['gps_location']:
                output.append(f"Location: {q['gps_location']}")
            
            if q['visible'] == 'true':
                output.append("Visible in feed: Yes")
            elif q['visible'] == 'false':
                output.append("Visible in feed: No")
                
            if q['camera_allowed'] == 'true':
                output.append("Camera upload allowed: Yes")
            
            output.append("")
            output.append(f"Question: {q['question']}")
            output.append("")
            
            # Format answer based on question type
            if q['type'] == 'GPS':
                output.append("Answer: [Check-in at location required]")
            elif q['type'] == 'CAMERA':
                output.append("Answer: [Photo submission required]")
            else:
                output.append(f"Answer: {q['answer']}")
            
            output.append("")
            output.append("-" * 80)
            output.append("")
        
        # Page break between categories
        output.append("\f")
    
    return "\n".join(output)

def create_category_indexes(categories):
    """Create separate index files for easy reference"""
    
    # Speaker index
    speaker_questions = categories.get('SPEAKER', [])
    if speaker_questions:
        speaker_index = []
        speaker_index.append("M365 NYC GOOSECHASE - SPEAKER QUESTIONS INDEX")
        speaker_index.append("=" * 60)
        speaker_index.append(f"Total Speaker Questions: {len(speaker_questions)}")
        speaker_index.append("")
        
        # Group by speaker
        speakers = defaultdict(list)
        for q in speaker_questions:
            # Extract speaker name
            match = re.match(r'^(.+?)\s*-\s*(Speaker Fun Fact|Session Quiz|Bonus Research)', q['name'])
            if match:
                speaker_name = match.group(1).strip()
                speakers[speaker_name].append(q)
        
        for speaker, questions in sorted(speakers.items()):
            speaker_index.append(f"{speaker}: {len(questions)} questions")
        
        with open("speaker_questions_index.txt", 'w', encoding='utf-8') as f:
            f.write("\n".join(speaker_index))
    
    # Sponsor index
    sponsor_questions = categories.get('SPONSOR', [])
    if sponsor_questions:
        sponsor_index = []
        sponsor_index.append("M365 NYC GOOSECHASE - SPONSOR QUESTIONS INDEX")
        sponsor_index.append("=" * 60)
        sponsor_index.append(f"Total Sponsor Questions: {len(sponsor_questions)}")
        sponsor_index.append("")
        
        # Group by sponsor
        sponsors = defaultdict(list)
        for q in sponsor_questions:
            # Extract sponsor name
            patterns = [
                r'Sponsor.*?-\s*(.+?)\s*📸',
                r'Sponsor.*?-\s*(.+?)\s*😃',
                r'Sponsor.*?-\s*(.+?)\s*❓',
                r'Sponsor.*?-\s*(.+?)\s*🔍',
                r'Sponsor.*?-\s*(.+?)\s*-',
                r'Sponsor.*?-\s*(.+?)$'
            ]
            
            sponsor_name = None
            for pattern in patterns:
                match = re.search(pattern, q['name'])
                if match:
                    sponsor_name = match.group(1).strip()
                    sponsor_name = re.sub(r'\s*(Q[12]|Photo|Fun Fact|Services|Bonus Research).*$', '', sponsor_name)
                    break
            
            if sponsor_name:
                sponsors[sponsor_name].append(q)
        
        for sponsor, questions in sorted(sponsors.items()):
            sponsor_index.append(f"{sponsor}: {len(questions)} questions")
        
        with open("sponsor_questions_index.txt", 'w', encoding='utf-8') as f:
            f.write("\n".join(sponsor_index))

def main():
    csv_path = Path("M365 NYC Goosechase's missions (6).csv")
    
    if not csv_path.exists():
        print(f"Error: CSV file not found at {csv_path}")
        return
    
    try:
        print("Reading and parsing complete CSV file for ALL questions...")
        categories, total_questions = parse_all_questions(csv_path)
        
        print(f"Found {total_questions} total questions across {len(categories)} categories")
        print("\nCategory breakdown:")
        for category, questions in sorted(categories.items()):
            print(f"  {category:20} {len(questions):3} questions")
        
        print("\nGenerating comprehensive master file...")
        master_content = format_master_file(categories, total_questions)
        
        # Save master file
        master_file = "COMPLETE_MASTER_ALL_QUESTIONS_AND_ANSWERS.txt"
        with open(master_file, 'w', encoding='utf-8') as f:
            f.write(master_content)
        
        print(f"Master file created: {master_file}")
        
        # Create category indexes
        print("Creating category indexes...")
        create_category_indexes(categories)
        
        print("\nCOMPLETE! Files created:")
        print(f"   - {master_file}")
        print(f"   - speaker_questions_index.txt")  
        print(f"   - sponsor_questions_index.txt")
        print(f"\nTotal questions included: {total_questions}")
        
    except Exception as e:
        print(f"Error processing file: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()