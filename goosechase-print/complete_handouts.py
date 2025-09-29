#!/usr/bin/env python3
"""
Complete Goosechase Handout Generator
Creates individual and master files for both speakers and sponsors
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

def extract_sponsor_name(title):
    """Extract sponsor name from title - improved patterns for all 7 sponsors"""
    # Patterns to match various sponsor formats
    patterns = [
        r'Sponsor\s+Photo\s*-\s*(.+?)\s*📸',                    # Photo format
        r'Sponsor\s+Fun\s+Fact\s*-\s*(.+?)\s*😃',              # Fun fact format  
        r'Sponsor\s+Services\s*-\s*(.+?)\s*-\s*Q[12]',         # Services Q1/Q2 format
        r'Sponsor\s+Bonus\s+Research.*?-\s*(.+?)\s*🔍❓',       # Bonus research format
        r'Sponsor.*?-\s*(.+?)\s*-\s*Q[12]',                    # Generic Q1/Q2 format
        r'Sponsor.*?-\s*(.+?)\s*📸',                           # Generic photo
        r'Sponsor.*?-\s*(.+?)\s*😃',                           # Generic fun fact
        r'Sponsor.*?-\s*(.+?)\s*❓',                           # Generic question
        r'Sponsor.*?-\s*(.+?)\s*🔍',                           # Generic research
        r'Sponsor.*?-\s*(.+?)$'                                # Fallback pattern
    ]
    
    for pattern in patterns:
        match = re.search(pattern, title)
        if match:
            sponsor = match.group(1).strip()
            # Clean up common suffixes and extra spaces
            sponsor = re.sub(r'\s*(Q[12]|Photo|Fun Fact|Services|Bonus Research).*$', '', sponsor)
            sponsor = re.sub(r'\s*-\s*$', '', sponsor)  # Remove trailing dash
            return sponsor.strip()
    
    return None

def parse_csv_for_speakers_and_sponsors(csv_path):
    """Parse CSV and group both speaker and sponsor questions"""
    speaker_missions = defaultdict(list)
    sponsor_missions = defaultdict(list)
    
    with open(csv_path, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        
        for row in reader:
            mission_type = row.get('Type', '')
            name = clean_text(row.get('Name', ''))
            description = clean_text(row.get('Description', ''))
            points = row.get('Points', '')
            accepted_answers = clean_text(row.get('Accepted Answers', ''))
            
            # Only process TEXT and CAMERA type missions
            if (mission_type in ['TEXT', 'CAMERA']) and name and description:
                mission_data = {
                    'title': name,
                    'question': description,
                    'answer': accepted_answers,
                    'points': points,
                    'type': mission_type
                }
                
                # Check if it's a speaker question
                speaker_name = extract_speaker_name(name)
                if speaker_name:
                    speaker_missions[speaker_name].append(mission_data)
                    continue
                
                # Check if it's a sponsor question
                if 'Sponsor' in name:
                    sponsor_name = extract_sponsor_name(name)
                    if sponsor_name:
                        sponsor_missions[sponsor_name].append(mission_data)
    
    # Debug: Print found sponsors
    print(f"Debug: Found {len(sponsor_missions)} sponsors:")
    for sponsor in sorted(sponsor_missions.keys()):
        print(f"  - {sponsor} ({len(sponsor_missions[sponsor])} questions)")
    
    return speaker_missions, sponsor_missions

def format_handout(name, missions, is_sponsor=False):
    """Format a handout page for a speaker or sponsor"""
    output = []
    output.append("=" * 80)
    prefix = "SPONSOR" if is_sponsor else "SPEAKER"
    output.append(f"M365 NYC GOOSECHASE - {prefix}: {name.upper()}")
    output.append("=" * 80)
    output.append("")
    
    # Sort missions by type
    def get_sort_key(mission):
        title = mission['title']
        if 'Fun Fact' in title:
            return '1'
        elif 'Photo' in title:
            return '1.5'
        elif 'Quiz 1' in title or 'Services' in title and 'Q1' in title:
            return '2'
        elif 'Quiz 2' in title or 'Services' in title and 'Q2' in title:
            return '3'
        elif 'Bonus' in title:
            return '4'
        else:
            return '5'
    
    sorted_missions = sorted(missions, key=get_sort_key)
    
    for i, mission in enumerate(sorted_missions, 1):
        # Determine question type
        title = mission['title']
        if 'Fun Fact' in title:
            q_type = "Fun Fact"
        elif 'Photo' in title:
            q_type = "Photo Challenge"
        elif 'Quiz 1' in title or ('Services' in title and 'Q1' in title):
            q_type = "Quiz 1" if not is_sponsor else "Services Q1"
        elif 'Quiz 2' in title or ('Services' in title and 'Q2' in title):
            q_type = "Quiz 2" if not is_sponsor else "Services Q2"
        elif 'Bonus' in title:
            q_type = "Bonus Research Question"
        else:
            q_type = "Question"
        
        output.append(f"{q_type.upper()}:")
        output.append(f"Points: {mission['points']}")
        output.append(f"Type: {'Photo' if mission['type'] == 'CAMERA' else 'Text Answer'}")
        output.append("")
        output.append(f"Question: {mission['question']}")
        output.append("")
        
        if mission['answer']:
            output.append(f"Answer: {mission['answer']}")
        else:
            output.append("Answer: [Photo submission required]" if mission['type'] == 'CAMERA' else "Answer: [No answer provided]")
        
        if i < len(sorted_missions):
            output.append("")
            output.append("-" * 60)
            output.append("")
    
    output.append("")
    output.append("=" * 80)
    
    return "\n".join(output)

def create_individual_handouts(missions_dict, output_dir, is_sponsor=False):
    """Create individual handout files"""
    output_dir = Path(output_dir)
    output_dir.mkdir(exist_ok=True)
    
    created_files = []
    
    for name, missions in missions_dict.items():
        # Create safe filename
        safe_name = re.sub(r'[^\w\s-]', '', name).strip()
        safe_name = re.sub(r'[-\s]+', '_', safe_name)
        filename = f"{safe_name}_handout.txt"
        
        handout_content = format_handout(name, missions, is_sponsor)
        
        file_path = output_dir / filename
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(handout_content)
        
        created_files.append((name, file_path, len(missions)))
    
    return created_files

def create_master_file(missions_dict, filename, is_sponsor=False):
    """Create master file with page breaks"""
    output = []
    
    # Title page
    prefix = "SPONSOR" if is_sponsor else "SPEAKER"
    output.append("=" * 80)
    output.append(f"M365 NYC GOOSECHASE - ALL {prefix} HANDOUTS")
    output.append("=" * 80)
    output.append("")
    output.append(f"Total {prefix.lower()}s: {len(missions_dict)}")
    output.append("")
    
    for name in sorted(missions_dict.keys()):
        output.append(f"• {name}")
    
    output.append("")
    output.append("=" * 80)
    output.append("\f")  # Form feed character for page break
    
    # Individual handouts
    for i, (name, missions) in enumerate(sorted(missions_dict.items()), 1):
        handout_content = format_handout(name, missions, is_sponsor)
        output.append(handout_content)
        
        # Add page break except for last page
        if i < len(missions_dict):
            output.append("\f")
    
    # Save master file
    with open(filename, 'w', encoding='utf-8') as f:
        f.write("\n".join(output))
    
    return filename

def main():
    csv_path = Path("M365 NYC Goosechase's missions (6).csv")
    
    if not csv_path.exists():
        print(f"Error: CSV file not found at {csv_path}")
        return
    
    try:
        print("Reading and parsing CSV file for speakers and sponsors...")
        speaker_missions, sponsor_missions = parse_csv_for_speakers_and_sponsors(csv_path)
        
        print(f"Found {len(speaker_missions)} speakers and {len(sponsor_missions)} sponsors with questions")
        
        # Create speaker handouts
        print("\nCreating speaker handouts...")
        speaker_files = create_individual_handouts(speaker_missions, "speaker_handouts", False)
        speaker_master = create_master_file(speaker_missions, "all_speaker_handouts_master.txt", False)
        
        print(f"Created {len(speaker_files)} individual speaker handouts")
        print(f"Created master speaker file: {speaker_master}")
        
        # Create sponsor handouts
        if sponsor_missions:
            print("\nCreating sponsor handouts...")
            sponsor_files = create_individual_handouts(sponsor_missions, "sponsor_handouts", True)
            sponsor_master = create_master_file(sponsor_missions, "all_sponsor_handouts_master.txt", True)
            
            print(f"Created {len(sponsor_files)} individual sponsor handouts")
            print(f"Created master sponsor file: {sponsor_master}")
            
            print("\nSponsor handouts created:")
            print("-" * 60)
            for name, file_path, question_count in sorted(sponsor_files):
                print(f"{name:30} ({question_count} questions) -> {file_path.name}")
        else:
            print("\nNo sponsor questions found in the CSV file")
        
        print("\nSpeaker handouts summary:")
        print("-" * 60)
        for name, file_path, question_count in sorted(speaker_files):
            print(f"{name:35} ({question_count} questions) -> {file_path.name}")
        
        print(f"\nAll files created successfully!")
        print(f"Speaker handouts: speaker_handouts/")
        print(f"Speaker master file: {speaker_master}")
        if sponsor_missions:
            print(f"Sponsor handouts: sponsor_handouts/")
            print(f"Sponsor master file: {sponsor_master}")
        
    except Exception as e:
        print(f"Error processing file: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()