#!/usr/bin/env python3
"""
Goosechase Mission Printer
Extracts and formats questions and answers from the M365 NYC Goosechase CSV file
"""

import csv
import sys
from pathlib import Path

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

def parse_csv_file(csv_path):
    """Parse the CSV file and extract relevant mission data"""
    missions = []
    
    with open(csv_path, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        
        for row in reader:
            mission_type = row.get('Type', '')
            name = clean_text(row.get('Name', ''))
            description = clean_text(row.get('Description', ''))
            points = row.get('Points', '')
            accepted_answers = clean_text(row.get('Accepted Answers', ''))
            
            # Skip GPS and CAMERA types as they don't have traditional Q&A
            if mission_type == 'TEXT' and name and description:
                missions.append({
                    'name': name,
                    'question': description,
                    'answer': accepted_answers,
                    'points': points
                })
    
    return missions

def format_for_print(missions):
    """Format missions for clean printing"""
    output = []
    output.append("=" * 80)
    output.append("M365 NYC GOOSECHASE - QUESTIONS & ANSWERS")
    output.append("=" * 80)
    output.append("")
    
    for i, mission in enumerate(missions, 1):
        output.append(f"QUESTION {i}:")
        output.append(f"Title: {mission['name']}")
        output.append(f"Points: {mission['points']}")
        output.append("")
        output.append(f"Question: {mission['question']}")
        output.append("")
        
        if mission['answer']:
            output.append(f"Answer: {mission['answer']}")
        else:
            output.append("Answer: [No answer provided]")
        
        output.append("")
        output.append("-" * 60)
        output.append("")
    
    return "\n".join(output)

def main():
    csv_path = Path(r"C:\Users\thoma\Downloads\M365 NYC Goosechase's missions.csv")
    
    if not csv_path.exists():
        print(f"Error: CSV file not found at {csv_path}")
        sys.exit(1)
    
    try:
        print("Reading and parsing CSV file...")
        missions = parse_csv_file(csv_path)
        
        print(f"Found {len(missions)} text-based missions with questions and answers")
        
        formatted_output = format_for_print(missions)
        
        # Save to file
        output_path = Path("goosechase_questions_answers.txt")
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(formatted_output)
        
        print(f"Clean formatted output saved to: {output_path.absolute()}")
        
        # Also print to console
        print("\n" + "=" * 40)
        print("PREVIEW (first 3 questions):")
        print("=" * 40)
        
        try:
            preview_missions = missions[:3]
            preview_output = format_for_print(preview_missions)
            # Handle encoding issues for console output
            print(preview_output.encode('utf-8', errors='replace').decode('utf-8'))
        except UnicodeEncodeError:
            print("Preview contains special characters that can't be displayed in console.")
            print("Check the full output file for complete content.")
        
        if len(missions) > 3:
            print(f"\n... and {len(missions) - 3} more questions")
            print(f"Full output saved to: {output_path.absolute()}")
        
    except Exception as e:
        print(f"Error processing file: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()