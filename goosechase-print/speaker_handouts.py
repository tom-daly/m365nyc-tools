#!/usr/bin/env python3
"""
Goosechase Speaker Handout Generator
Creates individual handout pages for each speaker's questions
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

def extract_speaker_name(title):
    """Extract speaker name from title"""
    # Pattern to match "Name - Speaker Fun Fact" or "Name - Session Quiz" etc.
    pattern = r'^(.+?)\s*-\s*(Speaker Fun Fact|Session Quiz|Bonus Research Ques)'
    match = re.match(pattern, title)
    
    if match:
        return match.group(1).strip()
    
    return None

def parse_csv_for_speakers(csv_path):
    """Parse CSV and group speaker questions"""
    speaker_missions = defaultdict(list)
    
    with open(csv_path, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        
        for row in reader:
            mission_type = row.get('Type', '')
            name = clean_text(row.get('Name', ''))
            description = clean_text(row.get('Description', ''))
            points = row.get('Points', '')
            accepted_answers = clean_text(row.get('Accepted Answers', ''))
            
            # Only process TEXT type missions
            if mission_type == 'TEXT' and name and description:
                speaker_name = extract_speaker_name(name)
                
                if speaker_name:
                    mission_data = {
                        'title': name,
                        'question': description,
                        'answer': accepted_answers,
                        'points': points
                    }
                    speaker_missions[speaker_name].append(mission_data)
    
    return speaker_missions

def format_speaker_handout(speaker_name, missions):
    """Format a handout page for a specific speaker"""
    output = []
    output.append("=" * 80)
    output.append(f"M365 NYC GOOSECHASE - {speaker_name.upper()}")
    output.append("=" * 80)
    output.append("")
    
    # Sort missions by type (Fun Fact, Quiz 1, Quiz 2, Bonus)
    sorted_missions = sorted(missions, key=lambda x: (
        '1' if 'Fun Fact' in x['title'] else
        '2' if 'Quiz 1' in x['title'] else
        '3' if 'Quiz 2' in x['title'] else
        '4' if 'Bonus' in x['title'] else
        '5'
    ))
    
    for i, mission in enumerate(sorted_missions, 1):
        # Determine question type
        if 'Fun Fact' in mission['title']:
            q_type = "Speaker Fun Fact"
        elif 'Quiz 1' in mission['title']:
            q_type = "Session Quiz 1"
        elif 'Quiz 2' in mission['title']:
            q_type = "Session Quiz 2"
        elif 'Bonus' in mission['title']:
            q_type = "Bonus Research Question"
        else:
            q_type = "Question"
        
        output.append(f"{q_type.upper()}:")
        output.append(f"Points: {mission['points']}")
        output.append("")
        output.append(f"Question: {mission['question']}")
        output.append("")
        
        if mission['answer']:
            output.append(f"Answer: {mission['answer']}")
        else:
            output.append("Answer: [No answer provided]")
        
        if i < len(sorted_missions):
            output.append("")
            output.append("-" * 60)
            output.append("")
    
    output.append("")
    output.append("=" * 80)
    
    return "\n".join(output)

def create_all_handouts(speaker_missions):
    """Create individual handout files for all speakers"""
    handout_dir = Path("speaker_handouts")
    handout_dir.mkdir(exist_ok=True)
    
    created_files = []
    
    for speaker_name, missions in speaker_missions.items():
        # Create safe filename
        safe_name = re.sub(r'[^\w\s-]', '', speaker_name).strip()
        safe_name = re.sub(r'[-\s]+', '_', safe_name)
        filename = f"{safe_name}_handout.txt"
        
        handout_content = format_speaker_handout(speaker_name, missions)
        
        file_path = handout_dir / filename
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(handout_content)
        
        created_files.append((speaker_name, file_path, len(missions)))
    
    return created_files

def main():
    csv_path = Path(r"C:\Users\thoma\Downloads\M365 NYC Goosechase's missions.csv")
    
    if not csv_path.exists():
        print(f"Error: CSV file not found at {csv_path}")
        return
    
    try:
        print("Reading and parsing CSV file for speaker questions...")
        speaker_missions = parse_csv_for_speakers(csv_path)
        
        print(f"Found {len(speaker_missions)} speakers with questions")
        
        # Create all handouts
        created_files = create_all_handouts(speaker_missions)
        
        print(f"\nCreated {len(created_files)} speaker handout files:")
        print("-" * 60)
        
        for speaker_name, file_path, question_count in sorted(created_files):
            print(f"{speaker_name:35} ({question_count} questions) -> {file_path.name}")
        
        print(f"\nAll handouts saved in: {Path('speaker_handouts').absolute()}")
        
        # Also create a master list
        master_output = []
        master_output.append("SPEAKER HANDOUT INDEX")
        master_output.append("=" * 50)
        master_output.append("")
        
        for speaker_name, _, question_count in sorted(created_files):
            master_output.append(f"{speaker_name} ({question_count} questions)")
        
        with open("speaker_index.txt", 'w', encoding='utf-8') as f:
            f.write("\n".join(master_output))
        
        print(f"Speaker index saved to: speaker_index.txt")
        
    except Exception as e:
        print(f"Error processing file: {e}")

if __name__ == "__main__":
    main()