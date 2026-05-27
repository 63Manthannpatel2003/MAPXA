import React, { useMemo, useState } from "react";
import "./RosterPage.css";

const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const normalizeRosterByEmployee = (roster) => {
  const grouped = {};

  (roster?.roster || []).forEach((day) => {
    (day.shifts || []).forEach((shift) => {
      if (!grouped[shift.employee]) {
        grouped[shift.employee] = [];
      }

      grouped[shift.employee].push({
        date: day.date,
        day: day.day,
        time: shift.time,
      });
    });
  });

  return grouped;
};

const RosterPage = ({ result, onBack }) => {
  const roster = result?.roster || null;
  const processedData = result?.data || null;
  const employeeNames = useMemo(
    () => Object.keys(normalizeRosterByEmployee(roster)),
    [roster]
  );
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [selectedDay, setSelectedDay] = useState("all");

  const filteredRoster = useMemo(() => {
    if (!roster?.roster) {
      return [];
    }

    return roster.roster
      .filter((day) => selectedDay === "all" || day.day === selectedDay)
      .map((day) => ({
        ...day,
        shifts: (day.shifts || []).filter(
          (shift) => selectedEmployee === "all" || shift.employee === selectedEmployee
        ),
      }))
      .filter((day) => day.shifts.length);
  }, [roster, selectedDay, selectedEmployee]);

  const rosterByEmployee = useMemo(
    () => normalizeRosterByEmployee({ roster: filteredRoster }),
    [filteredRoster]
  );

  return (
    <div className="roster-page">
      <div className="roster-shell">
        <div className="roster-topbar">
          <button className="roster-back" onClick={onBack}>
            Back to Upload
          </button>

          <div className="roster-heading">
            <span className="roster-kicker">Generated Roster</span>
            <h1>Smart Roster Overview</h1>
            <p>{roster?.summary || "Interactive roster view from the processed file."}</p>
          </div>
        </div>

        <div className="roster-filters">
          <label>
            Employee
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
            >
              <option value="all">All employees</option>
              {employeeNames.map((employee) => (
                <option key={employee} value={employee}>
                  {employee}
                </option>
              ))}
            </select>
          </label>

          <label>
            Day
            <select value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)}>
              <option value="all">All days</option>
              {days.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </label>

          <div className="roster-stat">
            <span>{filteredRoster.length}</span>
            <small>scheduled days</small>
          </div>
        </div>

        <div className="roster-grid">
          <section className="roster-panel">
            <div className="panel-head">
              <h2>Schedule</h2>
            </div>

            <div className="schedule-list">
              {filteredRoster.map((day) => (
                <article className="schedule-card" key={day.date}>
                  <div className="schedule-title">
                    <h3>{day.day}</h3>
                    <span>{day.date}</span>
                  </div>

                  <div className="schedule-shifts">
                    {day.shifts.map((shift, index) => (
                      <div className="shift-pill" key={`${day.date}-${shift.employee}-${index}`}>
                        <strong>{shift.employee}</strong>
                        <span>{shift.time}</span>
                      </div>
                    ))}
                  </div>
                </article>
              ))}

              {!filteredRoster.length && <p className="empty-state">No shifts match this filter.</p>}
            </div>
          </section>

          <section className="roster-panel">
            <div className="panel-head">
              <h2>By Employee</h2>
            </div>

            <div className="employee-list">
              {Object.entries(rosterByEmployee).map(([employee, shifts]) => (
                <article className="employee-card" key={employee}>
                  <div className="employee-card-head">
                    <h3>{employee}</h3>
                    <span>{shifts.length} shifts</span>
                  </div>

                  <div className="employee-card-body">
                    {shifts.map((shift, index) => (
                      <div className="employee-shift" key={`${employee}-${shift.date}-${index}`}>
                        <span>{shift.day}</span>
                        <strong>{shift.time}</strong>
                      </div>
                    ))}
                  </div>
                </article>
              ))}

              {!Object.keys(rosterByEmployee).length && (
                <p className="empty-state">No employee data available for this filter.</p>
              )}
            </div>
          </section>
        </div>

      </div>
    </div>
  );
};

export default RosterPage;
