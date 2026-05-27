import csv
import io
import importlib
import json
import os
import re
import time
import zipfile
from datetime import datetime, timedelta
import xml.etree.ElementTree as ET

import PyPDF2

from config import Config

NAME_KEYS = {'name', 'employee', 'employee_name', 'member', 'staff', 'worker', 'person'}
DAY_KEYS = {'day', 'weekday'}
DATE_KEYS = {'date', 'shift_date'}
TIME_KEYS = {'time', 'hours', 'availability', 'shift', 'slot'}
START_KEYS = {'start', 'start_time', 'from'}
END_KEYS = {'end', 'end_time', 'to'}
NAME_REGEX = re.compile(r"^(?:[A-Z][a-zA-Z'-]+|[A-Z]{2,})(?:\s+(?:[A-Z][a-zA-Z'-]+|[A-Z]{2,})){1,3}$")
DAY_REGEX = re.compile(r'\b(mon(?:day)?|tue(?:s|sday)?|wed(?:nesday)?|thu(?:rs|rsday|r|rs\.)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)\b', re.IGNORECASE)
DATE_REGEX = re.compile(r'\b(\d{4}-\d{2}-\d{2}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b')
TIME_REGEX = re.compile(r'\b(\d{1,2}:\d{2}(?:\s*[AP]M)?\s*(?:-|to)\s*\d{1,2}:\d{2}(?:\s*[AP]M)?)\b', re.IGNORECASE)
SHIFT_TIME_REGEX = re.compile(r'\b(\d{1,2}(?::\d{2})?\s*[AP]M\s*(?:-|to)\s*\d{1,2}(?::\d{2})?\s*[AP]M)\b', re.IGNORECASE)
TABLE_ROW_REGEX = re.compile(
    r'(EMP\d+)\s+([A-Z][a-zA-Z\'-]+(?:\s+[A-Z][a-zA-Z\'-]+)+)\s+'
    r'((?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)(?:\s*,\s*(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday))*)\s+'
    r'(\d{1,2}(?::\d{2})?\s*[AP]M\s*(?:-|to)\s*\d{1,2}(?::\d{2})?\s*[AP]M)',
    re.IGNORECASE
)
DAY_MAP = {
    'mon': 'Monday',
    'monday': 'Monday',
    'tue': 'Tuesday',
    'tues': 'Tuesday',
    'tuesday': 'Tuesday',
    'wed': 'Wednesday',
    'wednesday': 'Wednesday',
    'thu': 'Thursday',
    'thur': 'Thursday',
    'thurs': 'Thursday',
    'thursday': 'Thursday',
    'fri': 'Friday',
    'friday': 'Friday',
    'sat': 'Saturday',
    'saturday': 'Saturday',
    'sun': 'Sunday',
    'sunday': 'Sunday'
}
DATE_FORMATS = (
    '%Y-%m-%d',
    '%d-%m-%Y',
    '%m-%d-%Y',
    '%d/%m/%Y',
    '%m/%d/%Y',
    '%d/%m/%y',
    '%m/%d/%y',
    '%d-%m-%y',
    '%m-%d-%y'
)


def extract_text_from_pdf(filepath):
    try:
        with open(filepath, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            text = ''
            for page in reader.pages:
                text += page.extract_text() or ''
        return text
    except Exception as e:
        raise Exception(f'Failed to extract text from PDF: {str(e)}')


def clean_value(value):
    if value is None:
        return ''
    if isinstance(value, str):
        return value.strip()
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    return str(value).strip()


def format_day(value):
    cleaned = clean_value(value)
    if not cleaned:
        return ''
    key = cleaned.lower().replace('.', '')
    return DAY_MAP.get(key, cleaned.title())


def format_date(value):
    cleaned = clean_value(value)
    if not cleaned:
        return ''
    if cleaned.isdigit():
        serial = int(cleaned)
        if serial > 59:
            return (datetime(1899, 12, 30) + timedelta(days=serial)).strftime('%Y-%m-%d')
    for date_format in DATE_FORMATS:
        try:
            return datetime.strptime(cleaned, date_format).strftime('%Y-%m-%d')
        except ValueError:
            continue
    return cleaned


def format_time(value):
    cleaned = clean_value(value)
    if not cleaned:
        return ''
    return re.sub(r'\s*(?:to|-)\s*', '-', cleaned, flags=re.IGNORECASE)


def extract_json(text):
    content = clean_value(text)
    if not content:
        return None
    if content.startswith('```'):
        parts = [part.strip() for part in content.split('```') if part.strip()]
        if parts:
            content = parts[-1]
            if content.startswith('json'):
                content = content[4:].strip()
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        start = content.find('{')
        end = content.rfind('}') + 1
        if start != -1 and end > start:
            return json.loads(content[start:end])
    return None


def is_likely_employee_name(line):
    cleaned = clean_value(line)
    if not cleaned or len(cleaned) > 40:
        return False
    if any(char in cleaned for char in ',.:;()[]{}'):
        return False
    return bool(NAME_REGEX.fullmatch(cleaned))


def get_value(row, keys):
    if not isinstance(row, dict):
        return ''
    normalized = {clean_value(key).lower(): value for key, value in row.items() if key is not None}
    for key in keys:
        if key in normalized:
            return clean_value(normalized[key])
    return ''


def ensure_day(slot):
    if slot.get('day'):
        return slot['day']
    date_value = slot.get('date')
    if not date_value:
        return ''
    try:
        return datetime.strptime(date_value, '%Y-%m-%d').strftime('%A')
    except ValueError:
        return ''


def build_slot(day='', date='', time=''):
    slot = {
        'day': format_day(day),
        'date': format_date(date),
        'time': format_time(time) or '9:00-17:00'
    }
    slot['day'] = ensure_day(slot) or slot['day']
    if not slot['day'] and not slot['date']:
        return None
    return slot


def add_slot(employees, name, slot):
    employee_name = clean_value(name)
    if not employee_name or not slot:
        return
    employee = employees.setdefault(employee_name, {
        'name': employee_name,
        'availability': [],
        'shifts': 0
    })
    if slot not in employee['availability']:
        employee['availability'].append(slot)
        employee['shifts'] = len(employee['availability'])


def normalize_employee_slots(employees, name, slots):
    if not isinstance(slots, list):
        return
    for slot in slots:
        if not isinstance(slot, dict):
            continue
        time = slot.get('time')
        if not time:
            start = clean_value(slot.get('start'))
            end = clean_value(slot.get('end'))
            if start or end:
                time = f'{start}-{end}'.strip('-')
        add_slot(employees, name, build_slot(slot.get('day', ''), slot.get('date', ''), time or ''))


def row_to_slot(row):
    day = get_value(row, DAY_KEYS)
    date = get_value(row, DATE_KEYS)
    time = get_value(row, TIME_KEYS)
    if not time:
        start = get_value(row, START_KEYS)
        end = get_value(row, END_KEYS)
        if start or end:
            time = f'{start}-{end}'.strip('-')
    return build_slot(day, date, time)


def normalize_rows(rows):
    employees = {}
    for row in rows:
        if not isinstance(row, dict):
            continue
        name = get_value(row, NAME_KEYS)
        if not name:
            continue
        add_slot(employees, name, row_to_slot(row))
    return employees


def normalize_structured_data(data):
    employees = {}

    if isinstance(data, dict) and isinstance(data.get('employees'), dict):
        for name, details in data['employees'].items():
            employee_name = clean_value(details.get('name')) or clean_value(name)
            normalize_employee_slots(employees, employee_name, details.get('availability', []))
        return employees

    if isinstance(data, list):
        for item in data:
            if isinstance(item, dict) and 'availability' in item:
                employee_name = get_value(item, NAME_KEYS) or clean_value(item.get('id'))
                normalize_employee_slots(employees, employee_name, item.get('availability', []))
            elif isinstance(item, dict):
                name = get_value(item, NAME_KEYS)
                if name:
                    add_slot(employees, name, row_to_slot(item))
        return employees

    if isinstance(data, dict):
        if 'availability' in data:
            employee_name = get_value(data, NAME_KEYS) or 'Employee'
            normalize_employee_slots(employees, employee_name, data.get('availability', []))
            return employees
        for name, value in data.items():
            if isinstance(value, dict) and 'availability' in value:
                employee_name = clean_value(value.get('name')) or clean_value(name)
                normalize_employee_slots(employees, employee_name, value.get('availability', []))
            elif isinstance(value, list):
                normalize_employee_slots(employees, name, value)
        if employees:
            return employees

    return employees


def parse_csv_text(text):
    cleaned = text.strip()
    if not cleaned:
        return []
    try:
        dialect = csv.Sniffer().sniff(cleaned[:1024], delimiters=',;\t|')
    except csv.Error:
        dialect = csv.excel
    reader = csv.DictReader(io.StringIO(cleaned), dialect=dialect)
    if not reader.fieldnames:
        return []
    rows = []
    for row in reader:
        if any(clean_value(value) for value in row.values()):
            rows.append(row)
    return rows


def parse_availability_text(text):
    table_employees = parse_employee_table_text(text)
    if table_employees:
        return table_employees

    lines = text.split('\n')
    employees = {}
    current_employee = None

    for line in lines:
        line = line.strip()
        if not line:
            continue

        if is_likely_employee_name(line):
            current_employee = line
            employees[current_employee] = {
                'name': current_employee,
                'availability': [],
                'shifts': 0
            }
            continue

        if not current_employee:
            continue

        day_matches = list(DAY_REGEX.finditer(line))
        if day_matches:
            date_match = DATE_REGEX.search(line)
            time_match = TIME_REGEX.search(line)
            for match in day_matches:
                slot = build_slot(
                    match.group(1),
                    date_match.group(1) if date_match else '',
                    time_match.group(1) if time_match else '9:00-17:00'
                )
                add_slot(employees, current_employee, slot)
            continue

        date_match = DATE_REGEX.search(line)
        time_match = TIME_REGEX.search(line)
        if date_match or time_match:
            slot = build_slot(
                '',
                date_match.group(1) if date_match else '',
                time_match.group(1) if time_match else '9:00-17:00'
            )
            add_slot(employees, current_employee, slot)

    return employees


def parse_employee_table_text(text):
    normalized_text = re.sub(r'\s+', ' ', text)
    employees = {}

    for match in TABLE_ROW_REGEX.finditer(normalized_text):
        _, name, days_value, time_value = match.groups()
        for day in [item.strip() for item in days_value.split(',') if item.strip()]:
            add_slot(employees, name, build_slot(day, '', time_value))

    return employees


def column_index(cell_reference):
    letters = ''.join(char for char in cell_reference if char.isalpha())
    index = 0
    for char in letters:
        index = index * 26 + ord(char.upper()) - 64
    return index - 1


def get_cell_value(cell, shared_strings, namespace):
    cell_type = cell.attrib.get('t')
    if cell_type == 'inlineStr':
        return ''.join(node.text or '' for node in cell.findall('.//a:t', namespace))
    value = cell.find('a:v', namespace)
    if value is None or value.text is None:
        return ''
    if cell_type == 's':
        return shared_strings[int(value.text)]
    return value.text


def extract_rows_from_xlsx(filepath):
    namespace = {'a': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    rows = []
    with zipfile.ZipFile(filepath) as workbook:
        shared_strings = []
        if 'xl/sharedStrings.xml' in workbook.namelist():
            root = ET.fromstring(workbook.read('xl/sharedStrings.xml'))
            shared_strings = [
                ''.join(node.text or '' for node in item.findall('.//a:t', namespace))
                for item in root.findall('a:si', namespace)
            ]

        for sheet_name in sorted(name for name in workbook.namelist() if name.startswith('xl/worksheets/sheet') and name.endswith('.xml')):
            sheet_root = ET.fromstring(workbook.read(sheet_name))
            headers = []
            for row in sheet_root.findall('.//a:sheetData/a:row', namespace):
                values = []
                for cell in row.findall('a:c', namespace):
                    index = column_index(cell.attrib.get('r', 'A1'))
                    while len(values) <= index:
                        values.append('')
                    values[index] = get_cell_value(cell, shared_strings, namespace)
                if not any(clean_value(value) for value in values):
                    continue
                if not headers:
                    headers = [clean_value(value) or f'column_{position + 1}' for position, value in enumerate(values)]
                    continue
                padded = values + [''] * max(0, len(headers) - len(values))
                rows.append({headers[position]: padded[position] for position in range(len(headers))})
    return rows


def normalize_availability(employees):
    normalized = {}

    for name, employee in employees.items():
        availability = employee.get('availability', [])
        if availability:
            normalized[name] = {
                'name': name,
                'availability': availability,
                'shifts': len(availability)
            }

    return normalized


def build_availability_response(employees):
    normalized = normalize_availability(employees)
    if not normalized:
        return None
    return {
        'employees': normalized,
        'total_employees': len(normalized),
        'extracted_at': datetime.now().isoformat()
    }


def wait_for_uploaded_file(file_ref, timeout=60):
    import google.generativeai as genai

    deadline = time.time() + timeout
    current = file_ref
    while time.time() < deadline:
        state_value = int(current.state)
        if state_value == 2:
            return current
        if state_value == 10:
            return None
        time.sleep(2)
        current = genai.get_file(current.name)
    return None


def extract_availability_with_gemini_from_pdf(filepath):
    if not Config.GOOGLE_API_KEY:
        return None

    import google.generativeai as genai

    genai.configure(api_key=Config.GOOGLE_API_KEY)
    uploaded_file = None

    try:
        uploaded_file = genai.upload_file(filepath, mime_type='application/pdf')
        uploaded_file = wait_for_uploaded_file(uploaded_file)
        if not uploaded_file:
            return None

        model = genai.GenerativeModel(Config.GEMINI_MODEL)
        prompt = """Extract only employee availability information from this PDF.

Return valid JSON only in this format:
{
  "employees": [
    {
      "name": "Employee Name",
      "availability": [
        {
          "day": "Monday",
          "date": "YYYY-MM-DD",
          "time": "09:00-17:00"
        }
      ]
    }
  ]
}

Rules:
- Include only real employee availability.
- Ignore project descriptions, summaries, instructions, and unrelated text.
- If a date is missing, use an empty string.
- If no availability data exists, return {"employees": []}."""

        response = model.generate_content([prompt, uploaded_file])
        data = extract_json(getattr(response, 'text', '') or '')
        if not data:
            return None
        return build_availability_response(normalize_structured_data(data))
    except Exception:
        return None
    finally:
        if uploaded_file:
            try:
                genai.delete_file(uploaded_file.name)
            except Exception:
                pass


def extract_availability_from_pdf(filepath):
    try:
        raw_text = extract_text_from_pdf(filepath)
        parsed = parse_availability_text(raw_text)
        response = build_availability_response(parsed)
        if response:
            return response
        return extract_availability_with_gemini_from_pdf(filepath)
    except Exception as e:
        raise Exception(f'PDF processing error: {str(e)}')


def extract_availability_from_json(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as file:
            data = json.load(file)
        return build_availability_response(normalize_structured_data(data))
    except Exception as e:
        raise Exception(f'JSON processing error: {str(e)}')


def extract_availability_from_csv(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8-sig', newline='') as file:
            rows = parse_csv_text(file.read())
        return build_availability_response(normalize_rows(rows))
    except Exception as e:
        raise Exception(f'CSV processing error: {str(e)}')


def extract_availability_from_text(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8-sig', errors='ignore') as file:
            text = file.read()
        try:
            data = json.loads(text)
            employees = normalize_structured_data(data)
        except json.JSONDecodeError:
            rows = parse_csv_text(text)
            employees = normalize_rows(rows) if rows else parse_availability_text(text)
        return build_availability_response(employees)
    except Exception as e:
        raise Exception(f'Text processing error: {str(e)}')


def extract_availability_from_excel(filepath):
    try:
        rows = []
        pandas_spec = importlib.util.find_spec('pandas')
        if pandas_spec is not None:
            import pandas as pd
            workbook = pd.read_excel(filepath, sheet_name=None)
            for sheet in workbook.values():
                rows.extend(sheet.fillna('').to_dict(orient='records'))
        if not rows:
            rows = extract_rows_from_xlsx(filepath)
        return build_availability_response(normalize_rows(rows))
    except Exception as e:
        raise Exception(f'Excel processing error: {str(e)}')


def extract_availability_from_file(filepath):
    extension = os.path.splitext(filepath)[1].lower()
    if extension == '.pdf':
        return extract_availability_from_pdf(filepath)
    if extension == '.json':
        return extract_availability_from_json(filepath)
    if extension == '.csv':
        return extract_availability_from_csv(filepath)
    if extension == '.txt':
        return extract_availability_from_text(filepath)
    if extension in {'.xls', '.xlsx', '.xlsm', '.xltx', '.xltm'}:
        return extract_availability_from_excel(filepath)
    raise Exception(f'Unsupported file type: {extension}')