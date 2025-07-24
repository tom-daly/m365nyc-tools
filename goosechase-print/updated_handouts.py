#!/usr/bin/env python3
"""
Updated Goosechase Handout Generator
Creates individual and master files for both speakers and sponsors from the new CSV
Clears existing exports before generating new ones
"""

import csv
import re
import shutil
from pathlib import Path
from collections import defaultdict

def clean_existing_exports():
    """Remove existing export directories and files"""
    paths_to_clean = [
        "speaker_handouts",
        "sponsor_handouts", 
        "all_speaker_handouts_master.txt",
        "all_sponsor_handouts_master.txt",
        "all_questions_master.txt",
        "speaker_index.txt",
        "goosechase_questions_answers.txt"
    ]
    
    for path_str in paths_to_clean:
        path = Path(path_str)
        if path.exists():
            if path.is_dir():
                shutil.rmtree(path)
                print(f"Removed directory: {path}")
            else:
                path.unlink()
                print(f"Removed file: {path}")

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
    """Extract sponsor name from title - updated for new format"""
    # Known sponsors
    sponsors = [
        "SoHo Dragon / Orchestry",
        "Knostic", 
        "Devicie",
        "Crow Canyon",
        "AvePoint",
        "Cloudwell"
    ]
    
    # Pattern to match "Sponsor [Type] - [Name]" 
    patterns = [
        r'^Sponsor\s+(Photo|Fun Fact|Services|Bonus Research(?:\s+Ques)?)\s*-\s*(.+?)(?:\s+📸|\s+😃|\s+❓|\s+🔍❓)?$',
        r'^Sponsor\s+(.+?)\s*-\s*(.+?)(?:\s+📸|\s+😃|\s+❓|\s+🔍❓)?$'
    ]
    
    for pattern in patterns:
        match = re.match(pattern, title)
        if match:
            potential_name = match.group(2).strip()
            
            # Check if it matches any known sponsor (case insensitive)
            for sponsor in sponsors:
                if sponsor.lower() in potential_name.lower() or potential_name.lower() in sponsor.lower():
                    return sponsor
            
            # If no exact match, return what we found
            return potential_name
    
    return None

def parse_csv_for_speakers_and_sponsors(csv_path):
    """Parse CSV and group both speaker and sponsor questions (excludes CAMERA/photo questions)"""
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
            
            # Only process TEXT type missions (excluding CAMERA/photo challenges for individual handouts)
            if mission_type == 'TEXT' and name and description:
                mission_data = {
                    'title': name,
                    'question': description,
                    'answer': accepted_answers,
                    'points': points,
                    'type': 'TEXT'  # Only TEXT missions now
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
        elif 'Quiz 1' in title or ('Services' in title and 'Q1' in title):
            return '2'
        elif 'Quiz 2' in title or ('Services' in title and 'Q2' in title):
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
        output.append(f"Type: Text Answer")
        output.append("")
        output.append(f"Question: {mission['question']}")
        output.append("")
        
        if mission['answer']:
            output.append(f"Answer: {mission['answer']}")
        else:
            output.append("Answer: [Any answer accepted]")
        
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

def create_all_questions_master(speaker_missions, sponsor_missions, csv_path):
    """Create master file with ALL questions from the CSV file - organized by categories A-Z"""
    output = []
    
    # Parse ALL TEXT questions from CSV
    all_text_questions = []
    
    with open(csv_path, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        
        for row in reader:
            mission_type = row.get('Type', '')
            name = clean_text(row.get('Name', ''))
            description = clean_text(row.get('Description', ''))
            points = row.get('Points', '')
            accepted_answers = clean_text(row.get('Accepted Answers', ''))
            
            # Include ALL missions (TEXT and CAMERA) for the master file
            if mission_type in ['TEXT', 'CAMERA'] and name and description:
                # Determine category
                speaker_name = extract_speaker_name(name)
                if speaker_name:
                    # Subcategorize speaker questions
                    if 'Fun Fact' in name:
                        category = 'SPEAKER_PERSONAL'
                        participant = speaker_name
                    elif 'Session Quiz' in name:
                        category = 'SPEAKER_QUIZ'
                        participant = speaker_name
                    elif 'Bonus Research' in name:
                        category = 'SPEAKER_RESEARCH'
                        participant = speaker_name
                    else:
                        category = 'SPEAKER'
                        participant = speaker_name
                elif 'Sponsor' in name:
                    category = 'SPONSOR'
                    participant = extract_sponsor_name(name) or 'Unknown Sponsor'
                elif any(keyword in name for keyword in ['History', 'Flashback', 'Rewind', 'Time Machine', 'Backtrack', 'Past Perfect', 'Throwback', 'Way We Were']):
                    category = 'HISTORY'
                    participant = 'Historical Questions'
                elif 'Trivia' in name or 'Valuable' in name:
                    category = 'TRIVIA'
                    participant = 'General Trivia'
                elif 'Feedback' in name:
                    category = 'FEEDBACK'
                    participant = 'Event Feedback'
                elif 'Goose' in name:
                    category = 'GENERAL'
                    participant = 'General Questions'
                else:
                    category = 'OTHER'
                    participant = f'Miscellaneous ({name[:30]}...)'
                
                all_text_questions.append({
                    'title': name,
                    'question': description,
                    'answer': accepted_answers,
                    'points': points,
                    'category': category,
                    'participant': participant
                })
    
    # Title page
    output.append("=" * 80)
    output.append("M365 NYC GOOSECHASE - ALL QUESTIONS MASTER")
    output.append("=" * 80)
    output.append("")
    output.append(f"Total questions: {len(all_text_questions)}")
    output.append("")
    
    # Group by category
    categories = {}
    for question in all_text_questions:
        cat = question['category']
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(question)
    
    # Display summary by category with clear definitions
    output.append("QUESTION CATEGORIES:")
    output.append("")
    
    category_definitions = {
        'FEEDBACK': 'Event feedback and experience questions',
        'GENERAL': 'Fun general questions and games',
        'HISTORY': 'Questions about Microsoft and M365 Community Days history',
        'SPEAKER_PERSONAL': 'Personal fun facts and background about speakers',
        'SPEAKER_QUIZ': 'Technical quiz questions from speaker sessions',
        'SPEAKER_RESEARCH': 'In-depth research questions about speaker topics',
        'SPONSOR': 'Questions about sponsors, their services, and achievements',
        'TRIVIA': 'General Microsoft community and technology trivia'
    }
    
    for category in sorted(categories.keys()):
        definition = category_definitions.get(category, 'Miscellaneous questions')
        output.append(f"{category}: {len(categories[category])} questions")
        output.append(f"   → {definition}")
        output.append("")
    
    output.append("=" * 80)
    output.append("\f")  # Form feed character for page break
    
    # Questions organized by category alphabetically
    for category in sorted(categories.keys()):
        category_questions = sorted(categories[category], key=lambda x: x['participant'])
        
        output.append("=" * 80)
        output.append(f"CATEGORY: {category}")
        output.append("=" * 80)
        output.append("")
        
        for question in category_questions:
            title = question['title']
            
            # Determine question type from title
            if 'Fun Fact' in title:
                q_type = "Fun Fact"
            elif 'Quiz 1' in title or ('Services' in title and 'Q1' in title):
                q_type = "Quiz 1" if 'SPEAKER' in question['category'] else "Services Q1"
            elif 'Quiz 2' in title or ('Services' in title and 'Q2' in title):
                q_type = "Quiz 2" if 'SPEAKER' in question['category'] else "Services Q2"
            elif 'Bonus' in title:
                q_type = "Bonus Research Question"
            elif 'History' in title or any(keyword in title for keyword in ['Flashback', 'Rewind', 'Time Machine', 'Backtrack', 'Past Perfect', 'Throwback', 'Way We Were']):
                q_type = "History Question"
            elif 'Trivia' in title or 'Valuable' in title:
                q_type = "Trivia"
            elif 'Feedback' in title:
                q_type = "Feedback"
            elif 'Goose' in title:
                q_type = "General Question"
            else:
                q_type = "Question"
            
            output.append(f"PARTICIPANT: {question['participant']}")
            output.append(f"Type: {q_type}")
            output.append(f"Points: {question['points']}")
            output.append("")
            output.append(f"Question: {question['question']}")
            output.append("")
            
            if question['answer']:
                output.append(f"Answer: {question['answer']}")
            else:
                output.append("Answer: [Any answer accepted]")
            
            output.append("")
            output.append("-" * 60)
            output.append("")
        
        output.append("\f")  # Page break after each category
    
    # Save master file
    filename = "all_questions_master.txt"
    with open(filename, 'w', encoding='utf-8') as f:
        f.write("\n".join(output))
    
    return filename, len(all_text_questions)

def main():
    # Use the new CSV file
    csv_path = Path(r"C:\Users\thoma\Downloads\M365 NYC Goosechase's missions (2).csv")
    
    if not csv_path.exists():
        print(f"Error: CSV file not found at {csv_path}")
        return
    
    try:
        print("Clearing existing exports...")
        clean_existing_exports()
        
        print("\nReading and parsing new CSV file for speakers and sponsors...")
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
                print(f"{name:35} ({question_count} questions) -> {file_path.name}")
        else:
            print("\nNo sponsor questions found in the CSV file")
        
        print("\nSpeaker handouts summary:")
        print("-" * 60)
        for name, file_path, question_count in sorted(speaker_files):
            print(f"{name:35} ({question_count} questions)")
        
        # Create all questions master file
        print("\nCreating all questions master file...")
        all_questions_master, total_questions = create_all_questions_master(speaker_missions, sponsor_missions, csv_path)
        print(f"Created all questions master file: {all_questions_master} ({total_questions} questions total)")
        
        print(f"\nAll files created successfully!")
        print(f"Speaker handouts: speaker_handouts/ ({len(speaker_files)} files)")
        print(f"Speaker master file: {speaker_master}")
        if sponsor_missions:
            print(f"Sponsor handouts: sponsor_handouts/ ({len(sponsor_files)} files)")
            print(f"Sponsor master file: {sponsor_master}")
        print(f"All questions master file: {all_questions_master}")
        
    except Exception as e:
        print(f"Error processing file: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()