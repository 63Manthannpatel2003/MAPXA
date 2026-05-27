sample_availability = {
    "employees": {
        "John Smith": {
            "name": "John Smith",
            "availability": [
                {"day": "Monday", "date": "2024-01-15", "time": "9:00-17:00"},
                {"day": "Tuesday", "date": "2024-01-16", "time": "9:00-17:00"},
                {"day": "Wednesday", "date": "2024-01-17", "time": "13:00-21:00"},
                {"day": "Thursday", "date": "2024-01-18", "time": "9:00-17:00"},
                {"day": "Friday", "date": "2024-01-19", "time": "9:00-17:00"}
            ],
            "shifts": 5
        },
        "Emma Johnson": {
            "name": "Emma Johnson",
            "availability": [
                {"day": "Monday", "date": "2024-01-15", "time": "13:00-21:00"},
                {"day": "Tuesday", "date": "2024-01-16", "time": "13:00-21:00"},
                {"day": "Wednesday", "date": "2024-01-17", "time": "9:00-17:00"},
                {"day": "Thursday", "date": "2024-01-18", "time": "13:00-21:00"},
                {"day": "Friday", "date": "2024-01-19", "time": "13:00-21:00"}
            ],
            "shifts": 5
        },
        "Michael Chen": {
            "name": "Michael Chen",
            "availability": [
                {"day": "Monday", "date": "2024-01-15", "time": "9:00-17:00"},
                {"day": "Wednesday", "date": "2024-01-17", "time": "13:00-21:00"},
                {"day": "Thursday", "date": "2024-01-18", "time": "9:00-17:00"},
                {"day": "Friday", "date": "2024-01-19", "time": "13:00-21:00"},
                {"day": "Saturday", "date": "2024-01-20", "time": "9:00-17:00"}
            ],
            "shifts": 5
        },
        "Sarah Williams": {
            "name": "Sarah Williams",
            "availability": [
                {"day": "Tuesday", "date": "2024-01-16", "time": "9:00-17:00"},
                {"day": "Wednesday", "date": "2024-01-17", "time": "9:00-17:00"},
                {"day": "Thursday", "date": "2024-01-18", "time": "13:00-21:00"},
                {"day": "Friday", "date": "2024-01-19", "time": "9:00-17:00"},
                {"day": "Saturday", "date": "2024-01-20", "time": "13:00-21:00"}
            ],
            "shifts": 5
        }
    },
    "total_employees": 4,
    "extracted_at": "2024-01-14T10:00:00"
}


def get_sample_data():
    return sample_availability
