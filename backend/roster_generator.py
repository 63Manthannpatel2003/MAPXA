import json
from datetime import datetime, timedelta

import google.generativeai as genai

from config import Config


def format_availability_for_llm(availability_data):
    formatted = "Employee Availability Data:\n\n"

    for emp_name, emp_data in availability_data.items():
        formatted += f"Employee: {emp_data['name']}\n"
        formatted += "Available:\n"
        for slot in emp_data['availability']:
            formatted += f"  - {slot['day']} {slot['date']} {slot['time']}\n"
        formatted += "\n"

    return formatted


def extract_json(text):
    content = text.strip()
    if content.startswith('```'):
        parts = [part.strip() for part in content.split('```') if part.strip()]
        if parts:
            content = parts[-1]
            if content.startswith('json'):
                content = content[4:].strip()
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        json_start = content.find('{')
        json_end = content.rfind('}') + 1
        if json_start != -1 and json_end > json_start:
            return json.loads(content[json_start:json_end])
    return None


def parse_slot_date(slot):
    slot_date = slot.get('date', '')
    if not slot_date:
        return None
    try:
        return datetime.strptime(slot_date, '%Y-%m-%d').date()
    except ValueError:
        return None


def pick_employee(candidates, counts, rotation):
    ranked = sorted(candidates, key=lambda name: (counts.get(name, 0), rotation.index(name), name))
    selected = ranked[0]
    rotation.append(rotation.pop(rotation.index(selected)))
    return selected


def get_schedule_start_date():
    return datetime.now().date() + timedelta(days=1)


def collect_explicit_dates(employees, start_date):
    explicit_dates = set()
    for details in employees.values():
        for slot in details.get('availability', []):
            parsed_date = parse_slot_date(slot)
            if parsed_date and parsed_date >= start_date:
                explicit_dates.add(parsed_date)
    return sorted(explicit_dates)


def get_candidate_dates(employees):
    start_date = get_schedule_start_date()
    explicit_dates = collect_explicit_dates(employees, start_date)
    if explicit_dates:
        return explicit_dates
    return [start_date + timedelta(days=offset) for offset in range(14)]


def matches_slot(slot, current_date):
    slot_date = parse_slot_date(slot)
    if slot_date:
        return slot_date == current_date
    slot_day = (slot.get('day', '') or '').strip().lower()
    day_name = current_date.strftime('%A')
    return slot_day in {day_name.lower(), day_name[:3].lower()}


def build_fallback_roster(availability_data):
    employees = availability_data.get('employees', {})
    if not employees:
        return None

    counts = {name: 0 for name in employees}
    rotation = list(employees.keys())
    roster = []

    for current_date in get_candidate_dates(employees):
        day_name = current_date.strftime('%A')
        slots_by_time = {}

        for name, details in employees.items():
            for slot in details.get('availability', []):
                if matches_slot(slot, current_date):
                    slot_time = slot.get('time') or '9:00-17:00'
                    slots_by_time.setdefault(slot_time, []).append(name)

        shifts = []
        for slot_time in sorted(slots_by_time.keys()):
            employee = pick_employee(slots_by_time[slot_time], counts, rotation)
            counts[employee] += 1
            shifts.append({
                'time': slot_time,
                'employee': employee
            })

        if shifts:
            roster.append({
                'date': current_date.strftime('%Y-%m-%d'),
                'day': day_name,
                'shifts': shifts
            })

    return {
        'roster': roster,
        'summary': 'Roster generated from uploaded availability data starting from tomorrow.'
    }


def try_generate_with_gemini(availability_data):
    api_key = Config.GOOGLE_API_KEY
    if not api_key:
        return None

    try:
        genai.configure(api_key=api_key)

        employees_info = availability_data.get('employees', {})
        if not employees_info:
            return None

        formatted_availability = format_availability_for_llm(employees_info)
        schedule_start = get_schedule_start_date()
        schedule_end = schedule_start + timedelta(days=13)

        prompt = f"""Based on the following employee availability data, generate a fair and balanced roster.

{formatted_availability}

Scheduling rules:
1. Do not schedule any shifts for today. Start from tomorrow: {schedule_start.strftime('%Y-%m-%d')}
2. If the uploaded availability includes explicit dates, use those exact future dates only
3. If the uploaded availability does not include explicit dates, schedule the next 14 days from {schedule_start.strftime('%Y-%m-%d')} to {schedule_end.strftime('%Y-%m-%d')}
4. Ignore past dates and ignore today even if it appears in the source data
5. Assign shifts only during times when employees are available
6. Distribute work fairly among all employees
7. Avoid assigning the same person to all shifts

Generate the roster in the following JSON format only:
{{
  "roster": [
    {{
      "date": "YYYY-MM-DD",
      "day": "Monday",
      "shifts": [
        {{
          "time": "HH:MM-HH:MM",
          "employee": "Employee Name"
        }}
      ]
    }}
  ],
  "summary": "Brief summary of how shifts were allocated"
}}

Return only valid JSON, no additional text."""

        model = genai.GenerativeModel(Config.GEMINI_MODEL)
        response = model.generate_content(prompt)
        return extract_json(getattr(response, 'text', '') or '')
    except Exception:
        return None


def generate_roster(availability_data):
    roster = try_generate_with_gemini(availability_data)
    if roster:
        return roster

    fallback = build_fallback_roster(availability_data)
    if fallback:
        return fallback

    raise Exception('Roster generation error: no valid availability data found')